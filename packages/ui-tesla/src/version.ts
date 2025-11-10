/**
 * Tesla Design System Version
 * 
 * Centralized version constant for the Tesla-inspired design system.
 * Bump this constant when making breaking or significant changes to tokens,
 * components, or contracts.
 * 
 * Version History:
 * - ds-1.0: Initial Tesla design system implementation
 * - ds-1.1: Added structured component contracts, performance metrics integration,
 *           defensive cloning for window.tesla.components, and comprehensive
 *           TypeScript declarations for runtime extensions
 */
export const TESLA_DS_VERSION = "ds-1.1" as const;

export type TeslaDesignSystemVersion = typeof TESLA_DS_VERSION;
