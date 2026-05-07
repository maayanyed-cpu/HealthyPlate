import { redirect } from "next/navigation";

/* The main entry point lands users straight in the camera so they can
   try the AI vision before committing to setup. The marketing welcome
   screen still lives at /welcome for direct links. Onboarding is opt-in
   from the snap-page header CTA or any time after via the child-switcher
   on Home. */
export default function RootPage() {
  redirect("/snap");
}
