{{- define "lib-service.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "lib-service.labels" -}}
app.kubernetes.io/name: {{ include "lib-service.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | default .Chart.Version }}
{{- end -}}

{{- define "lib-service.renderEnv" -}}
{{- range .Values.env }}
        - name: {{ .name }}
          value: {{ .value | quote }}
{{- end }}
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          value: {{ .Values.otel.exporterEndpoint | quote }}
        - name: OTEL_RESOURCE_ATTRIBUTES
          value: "service.name={{ include \"lib-service.fullname\" . }},deployment.environment={{ .Release.Namespace }}"
        - name: OTEL_TRACES_SAMPLER_ARG
          value: {{ .Values.otel.sampleRatio | default 0.25 | quote }}
{{- end -}}

{{- define "lib-service.deployment" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "lib-service.fullname" . }}
  labels:
{{ include "lib-service.labels" . | indent 4 }}
spec:
  replicas: {{ .Values.autoscaling.minReplicas | default 2 }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ include "lib-service.fullname" . }}
  template:
    metadata:
      labels:
{{ include "lib-service.labels" . | indent 8 }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy | default "IfNotPresent" }}
          ports:
            - containerPort: {{ .Values.service.port }}
              name: http
          env:
{{ include "lib-service.renderEnv" . }}
          resources:
{{ toYaml .Values.resources | indent 12 }}
{{- if .Values.config }}
      volumes:
        - name: app-config
          configMap:
            name: {{ include "lib-service.fullname" . }}
{{- end }}
{{- end -}}

{{- define "lib-service.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "lib-service.fullname" . }}
  labels:
{{ include "lib-service.labels" . | indent 4 }}
spec:
  type: {{ .Values.service.type }}
  selector:
    app.kubernetes.io/name: {{ include "lib-service.fullname" . }}
  ports:
    - name: http
      protocol: TCP
      port: {{ .Values.service.port }}
      targetPort: http
{{- end -}}

{{- define "lib-service.hpa" -}}
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "lib-service.fullname" . }}
  labels:
{{ include "lib-service.labels" . | indent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "lib-service.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
{{- end -}}
{{- end -}}

{{- define "lib-service.config" -}}
{{- if .Values.config }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "lib-service.fullname" . }}
  labels:
{{ include "lib-service.labels" . | indent 4 }}
data:
{{ toYaml .Values.config | indent 2 }}
{{- end -}}
{{- end -}}
