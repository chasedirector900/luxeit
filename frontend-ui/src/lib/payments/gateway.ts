// Payment tokenization boundary.
//
// PCI-DSS: the raw card number (PAN) and CVV must NEVER be stored or sent to
// our own backend. In production this function is replaced by the payment
// gateway's client SDK / hosted fields (e.g. Flutterwave, DPO, Tingg), which
// takes the card details *directly* and returns an opaque vault `token` plus
// safe display metadata. We persist only that token + last4 + expiry. The CVV
// is used solely to tokenize and is discarded immediately afterwards.

export type CardTokenResult = {
  token: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export async function tokenizeCard(input: {
  number: string;
  cvv: string;
  expiry: string; // "MM/YY"
}): Promise<CardTokenResult> {
  const digits = input.number.replace(/\D/g, "");
  const [mm = "", yy = ""] = input.expiry.split("/");

  // TODO(prod): swap this stub for the gateway SDK call. The PAN/CVV go to the
  // gateway over TLS and are never returned to us — only the token below is.
  return {
    token: `tok_${crypto.randomUUID()}`,
    last4: digits.slice(-4),
    expMonth: Number(mm) || 0,
    expYear: yy ? 2000 + Number(yy) : 0,
  };
}
