import ConfiguratorPreviewClient from "./ConfiguratorPreviewClient";

type ConfiguratorPageProperties = {
  readonly params: { locale: string };
};

const ConfiguratorPage = ({ params }: ConfiguratorPageProperties) => (
  <ConfiguratorPreviewClient locale={params.locale} />
);

export default ConfiguratorPage;
