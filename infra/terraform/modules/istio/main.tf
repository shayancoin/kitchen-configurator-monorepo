resource "helm_release" "base" {
  name             = "istio-base"
  repository       = "https://istio-release.storage.googleapis.com/charts"
  chart            = "base"
  namespace        = var.namespace
  create_namespace = true
}

resource "helm_release" "istiod" {
  name       = "istiod"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "istiod"
  namespace  = var.namespace

  set {
    name  = "global.meshID"
    value = var.mesh_id
  }

  set {
    name  = "pilot.resources.requests.cpu"
    value = "200m"
  }

  depends_on = [helm_release.base]
}

resource "helm_release" "ingress" {
  name       = "istio-ingress"
  repository = "https://istio-release.storage.googleapis.com/charts"
  chart      = "gateway"
  namespace  = var.namespace

  set {
    name  = "service.annotations.service\\.beta\\.kubernetes\\.io/aws-load-balancer-type"
    value = "nlb"
  }

  set {
    name  = "service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "labels.app"
    value = "parviz-ingress"
  }

  depends_on = [helm_release.istiod]
}
