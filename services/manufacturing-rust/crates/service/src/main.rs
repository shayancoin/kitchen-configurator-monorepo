use std::{env, net::SocketAddr};

use manufacturing_service::serve;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let port: u16 = env::var("MANUFACTURING_PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(5055);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    serve(addr).await
}
