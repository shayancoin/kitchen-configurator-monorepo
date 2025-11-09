use std::net::SocketAddr;

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use manufacturing_cnc_bridge::{generate_program, CncArtifacts};
use manufacturing_kernel_adapter::{build_rectangular_module, CabinetParams, ModuleMetrics};
use serde::{Deserialize, Serialize};
use tracing::info;
use uuid::Uuid;

#[derive(Clone, Default)]
struct AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ManufacturingRequest {
    pub module: CabinetParams,
    #[serde(default)]
    pub job_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ManufacturingResponse {
    pub job_id: String,
    pub metrics: ModuleMetrics,
    pub cnc: CncArtifacts,
}

#[derive(Debug)]
pub struct ManufacturingError(anyhow::Error);

impl IntoResponse for ManufacturingError {
    fn into_response(self) -> axum::response::Response {
        let body = serde_json::json!({ "error": self.0.to_string() });
        (StatusCode::INTERNAL_SERVER_ERROR, Json(body)).into_response()
    }
}

impl<E> From<E> for ManufacturingError
where
    E: Into<anyhow::Error>,
{
    fn from(value: E) -> Self {
        Self(value.into())
    }
}

async fn generate(
    State(state): State<AppState>,
    Json(payload): Json<ManufacturingRequest>,
) -> Result<Json<ManufacturingResponse>, ManufacturingError> {
    let _ = state;
    let job_id = payload.job_id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let module = build_rectangular_module(payload.module);
    let cnc = generate_program(&payload.module)?;
    info!(job_id, "generated manufacturing artifacts");
    let response = ManufacturingResponse {
        job_id,
        metrics: module.metrics,
        cnc,
    };
    Ok(Json(response))
}

pub fn router() -> Router {
    Router::new()
        .route("/api/v1/generate", post(generate))
        .route("/healthz", get(|| async { Json(serde_json::json!({"status": "ok"})) }))
        .with_state(AppState)
}

pub async fn serve(addr: SocketAddr) -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_target(false).init();
    info!(%addr, "manufacturing service listening");
    axum::serve(tokio::net::TcpListener::bind(addr).await?, router()).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;

    #[tokio::test]
    async fn generate_endpoint_returns_metrics() {
        let app = router();
        let payload = serde_json::json!({
            "module": {
                "width_mm": 800.0,
                "height_mm": 720.0,
                "depth_mm": 600.0,
                "thickness_mm": 18.0
            },
            "job_id": "job-123"
        });
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/generate")
                    .method("POST")
                    .header("content-type", "application/json")
                    .body(Body::from(payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
