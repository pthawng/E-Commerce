import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

/**
 * OpenTelemetry SDK setup.
 * Initializes distributed tracing and metrics collection.
 */
export let otelSDK: NodeSDK | null = null;

if (process.env.OTEL_ENABLED === 'true') {
  otelSDK = new NodeSDK({
    serviceName: 'ray-paradis-backend',
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    metricReader: new PrometheusExporter({
      port: 9464,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-nestjs-core': { enabled: true },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
      }),
    ],
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    otelSDK
      ?.shutdown()
      .then(
        () => console.log('OTel SDK shut down successfully'),
        (err) => console.log('Error shutting down OTel SDK', err),
      )
      .finally(() => process.exit(0));
  });
}
