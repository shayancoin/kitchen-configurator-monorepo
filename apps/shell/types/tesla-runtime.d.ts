/**
 * Tesla Runtime Extension Contract
 * 
 * This file defines the TypeScript contract for runtime extensions to the window.tesla object.
 * All runtime injections must conform to these interfaces to ensure compile-time type safety.
 * 
 * Performance Budget:
 * - Injection overhead: T_injection ≤ 100–200ms (target: ≤150ms)
 * - Combined budget: T_injection + T_children_render ≤ 2000ms (TTI budget)
 * 
 * Implementation Mechanisms:
 * 1. Server-side transform (build-time): Inject via Next.js middleware or webpack plugin
 * 2. Client-side runtime boundary: Use inline <script> or async loader component
 * 
 * Reference Implementations:
 * - Server transform: packages/config/tesla-runtime-plugin.ts
 * - Client boundary: components/RuntimeConfigLoader.tsx
 * 
 * Testing Requirements:
 * - Measure injection time: performance.mark('tesla-runtime-ready') - navigationStart
 * - Validate TTI ≤ 2000ms in CI/CD gates
 * - Ensure strict TypeScript compilation passes
 */

export interface TeslaFeatureFlags {
  /** Enable AI-driven layout optimization */
  readonly enableAIOptimization?: boolean;
  
  /** Enable WASM compositor (requires COOP/COEP headers) */
  readonly enableWASMCompositor?: boolean;
  
  /** Enable real-time collaboration features */
  readonly enableCollaboration?: boolean;
  
  /** Enable advanced manufacturing outputs (DWG/CNC) */
  readonly enableManufacturingOutputs?: boolean;
  
  /** Custom feature flags - extensible record */
  readonly [key: string]: boolean | undefined;
}

export interface TeslaRuntimeConfig {
  /** API endpoint for GraphQL gateway */
  readonly apiEndpoint: string;
  
  /** Current locale (ISO 639-1 code) */
  readonly locale: string;
  
  /** Environment (development, staging, production) */
  readonly environment: 'development' | 'staging' | 'production';
  
  /** CDN base URL for static assets */
  readonly cdnBase?: string;
  
  /** Analytics tracking ID */
  readonly analyticsId?: string;
  
  /** Custom runtime configuration - extensible record */
  readonly [key: string]: string | number | boolean | undefined;
}

export interface TeslaPerfMetrics {
  /** Time to Interactive (ms since navigation start) */
  readonly tti?: number;
  
  /** Largest Contentful Paint (ms since navigation start) */
  readonly lcp?: number;
  
  /** First Input Delay (ms) */
  readonly fid?: number;
}

export interface TeslaPerfBudgetState {
  /** Whether any performance budget has been exceeded */
  readonly failed: boolean;
  
  /** List of budget violations with descriptions */
  readonly reasons: readonly string[];
}

export interface TeslaComponentContract {
  /** Required props for the component */
  readonly required: readonly string[];
  
  /** Optional props for the component */
  readonly optional: readonly string[];
  
  /** Component-specific metadata */
  readonly metadata?: Record<string, unknown>;
}

export interface TeslaComponentContracts {
  readonly header: TeslaComponentContract;
  readonly section: TeslaComponentContract;
  readonly configuratorPanel: TeslaComponentContract;
  readonly [key: string]: TeslaComponentContract;
}

export interface TeslaTokens {
  readonly colors: Record<string, string>;
  readonly typography: Record<string, string | number>;
  readonly spacing: Record<string, string | number>;
  readonly [key: string]: Record<string, string | number>;
}

/**
 * Global window.tesla contract
 * 
 * This interface defines the complete structure of the window.tesla object.
 * All runtime extensions must populate these fields according to the contract.
 */
export interface TeslaGlobalContract {
  /** Design system version (semver) */
  readonly version: string;
  
  /** Runtime feature flags */
  readonly featureFlags?: TeslaFeatureFlags;
  
  /** Runtime configuration */
  readonly runtimeConfig?: TeslaRuntimeConfig;
  
  /** Design system tokens (colors, typography, spacing) */
  readonly tokens: TeslaTokens;
  
  /** Component contracts (prop specifications) */
  readonly components: TeslaComponentContracts;
  
  /** Real-time performance metrics */
  readonly metrics?: TeslaPerfMetrics;
  
  /** Performance budget state */
  readonly perfBudget?: TeslaPerfBudgetState;
}

declare global {
  interface Window {
    /**
     * Tesla runtime extension point
     * 
     * Populated by server-side transforms or client-side runtime loaders.
     * See apps/shell/app/layout.tsx EXTEND_AI_HERE marker for injection points.
     */
    tesla: TeslaGlobalContract;
  }
}

export {};
