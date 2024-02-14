import PageHeader from "../../shared/components/PageHeader";
import { SamplesList } from "../../components/SamplesList";

export default function SamplesPage() {
  const pageRoute = "/samples";

  return (
    <>
      <PageHeader pageTitle={"samples"} pageRoute={pageRoute} />

      <SamplesList height={540} />
    </>
  );
}
