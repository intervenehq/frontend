import { render } from "preact";
import { Intervene } from "@intervene/frontend";

const INTERVENE_PUBLIC_KEY = import.meta.env["VITE_INTERVENE_PUBLIC_KEY"];

// ====== FOR DEMO PURPOSES ONLY. THIS SHOULD NOT EXIST IN FRONTEND
const INTERVENE_PRIVATE_KEY = import.meta.env["VITE_INTERVENE_PRIVATE_KEY"];
// ======

const PROVIDER = "google";
const USER_ID = "me@sudhanshug.com";

const intervene = new Intervene({
  publicKey: INTERVENE_PUBLIC_KEY,

  // adding host is optional, you can omit this entirely
  host: import.meta.env["VITE_INTERVENE_HOST"],
});

export function App() {
  const auth = async () => {
    // ====== FOR DEMO PURPOSES ONLY. THIS SHOULD HAPPEN IN THE BACKEND
    const response = await fetch(
      `http://localhost:3000/v1/integrations/${PROVIDER}/connections/${USER_ID}/hmac_digest`,
      {
        headers: {
          Authorization: `Bearer ${INTERVENE_PRIVATE_KEY}`,
        },
      }
    );
    const hmacDigest = await response.text();
    // ======

    const result = await intervene.auth(PROVIDER, USER_ID, hmacDigest);
    console.log(result);
  };

  return (
    <div>
      <button onClick={auth}>Auth with {PROVIDER}</button>
    </div>
  );
}

render(<App />, document.getElementById("app"));
