import ui from "@/components/public-ui.module.css";
import { AccessForm } from "@/components/AccessForm";
export const metadata = {
  title: "Accesso staff",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <section className={`${ui.page} ${ui.access} section`}>
      <div className="container-page">
        <AccessForm />
      </div>
    </section>
  );
}
