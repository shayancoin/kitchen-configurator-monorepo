import { NextFederationPlugin } from "@module-federation/nextjs-mf";
import type { NextConfig } from "next";
import path from "path";

type NextFederationPluginOptions = ConstructorParameters<
  typeof NextFederationPlugin
>[0];

type ModuleFederationConfig =
  | NextFederationPluginOptions
  | ((context: { isServer: boolean }) => NextFederationPluginOptions);

export type WithModuleFederationOptions = {
  readonly federationConfig: ModuleFederationConfig;
  readonly enabled?: boolean;
  readonly shim?: {
    readonly modules?: string[];
    readonly directory?: string;
  };
};

const defaultShimDirectory = path.join(process.cwd(), ".mf-shim");

const resolveShimPath = (specifier: string, directory: string) =>
  `${path.join(directory, ...specifier.split("/"))}.js`;

export const withConditionalModuleFederation = (
  baseConfig: NextConfig,
  options: WithModuleFederationOptions
): NextConfig => {
  const pluginEnabled =
    options.enabled ?? process.env.ENABLE_MF_PLUGIN === "true";
  const shimDirectory = options.shim?.directory ?? defaultShimDirectory;
  const shimModules = options.shim?.modules ?? [];

  return {
    ...baseConfig,
    webpack(config, context) {
      const workingConfig =
        typeof baseConfig.webpack === "function"
          ? baseConfig.webpack(config, context)
          : config;

      if (pluginEnabled) {
        const pluginOptions =
          typeof options.federationConfig === "function"
            ? options.federationConfig({
                isServer: Boolean(context.isServer)
              })
            : options.federationConfig;

        workingConfig.plugins ??= [];
        workingConfig.plugins.push(new NextFederationPlugin(pluginOptions));
        return workingConfig;
      }

      if (shimModules.length) {
        workingConfig.resolve ??= {};
        workingConfig.resolve.alias ??= {};
        for (const specifier of shimModules) {
          workingConfig.resolve.alias[specifier] = resolveShimPath(
            specifier,
            shimDirectory
          );
        }
      }

      return workingConfig;
    }
  };
};

export default withConditionalModuleFederation;
