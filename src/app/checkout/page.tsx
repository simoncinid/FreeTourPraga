import ui from "@/components/public-ui.module.css";
import { ReservationFlow } from "@/components/ReservationFlow";
export const metadata = {
  title: "Completa la prenotazione",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <section className={`${ui.page} ${ui.reservation} section`}>
      <div className="container-page">
        <ReservationFlow mode="checkout" />
      </div>
    </section>
  );
}
