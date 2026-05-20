export type Lang = "EN" | "TC";

interface ProcessStep {
  h: string;
  n: string;
  p: string;
}

interface Dictionary {
  cta: {
    request: string;
    browse: string;
    book: string;
    addToBag: string;
    requestPiece: string;
  };
  headline: { line1: string; line2: string; line3: string; line4em: string };
  hero: { eyebrow: string; sub: string };
  nav: {
    atelier: string;
    collection: string;
    request: string;
    vault: string;
    journal: string;
    account: string;
  };
  process: { title: string; kicker: string; steps: ProcessStep[] };
}

export const TRANSLATIONS: Record<Lang, Dictionary> = {
  EN: {
    nav: {
      atelier: "Atelier",
      collection: "The Collection",
      request: "Request a Piece",
      vault: "In the Vault",
      journal: "Journal",
      account: "Account",
    },
    cta: {
      request: "Request a Piece",
      browse: "Enter the Collection",
      book: "Book a Concierge Call",
      addToBag: "Reserve in the Vault",
      requestPiece: "Request via Concierge",
    },
    process: {
      title: "How the concierge works",
      kicker: "Four steps, one private channel.",
      steps: [
        {
          n: "01",
          h: "Tell us what you want",
          p: "Upload a photo, paste a link, or describe a memory. We accept everything from a runway look to a vintage flea-market find.",
        },
        {
          n: "02",
          h: "Receive your dossier",
          p: "Within 24 hours, your dedicated concierge confirms authenticity, sourcing options, and a transparent quote — exchange rates included.",
        },
        {
          n: "03",
          h: "Approve & pay securely",
          p: "Authorise the purchase from any device. We hold funds in escrow until the piece is inspected in our Taipei vault.",
        },
        {
          n: "04",
          h: "Receive at your door",
          p: "Hand-delivered insured shipping with discreet packaging, signature on receipt, and a lifetime authentication card.",
        },
      ],
    },
    hero: {
      eyebrow: "A proxy-shopping atelier for considered pieces",
      sub: "VERDA is a private concierge for sourcing fine leather, watchmaking and ready-to-wear from the world’s ateliers — with transparent pricing, authentication, and one human dedicated to your file.",
    },
    headline: {
      line1: "The wardrobe",
      line2: "you would have",
      line3: "built, had you",
      line4em: "been\nthere yourself.",
    },
  },
  TC: {
    nav: {
      atelier: "工坊",
      collection: "典藏",
      request: "指定代購",
      vault: "現貨櫥窗",
      journal: "誌",
      account: "會員",
    },
    cta: {
      request: "提交指定代購",
      browse: "瀏覽典藏",
      book: "預約專屬顧問",
      addToBag: "加入現貨櫥窗",
      requestPiece: "透過顧問代購",
    },
    process: {
      title: "專屬顧問流程",
      kicker: "四步，一條私密通道",
      steps: [
        {
          n: "01",
          h: "告訴我們您想要的",
          p: "上傳照片、貼上連結，或描述一段回憶。從伸展台造型到復古市集的靈光乍現，我們都能承接。",
        },
        {
          n: "02",
          h: "收到您的代購檔案",
          p: "24 小時內，您的專屬顧問將提交鑑定結果、來源方案，與透明報價（含即時匯率）。",
        },
        {
          n: "03",
          h: "確認並安心付款",
          p: "可於任何裝置授權交易。在台北鑑賞庫驗貨完成前，款項保管於信託帳戶。",
        },
        {
          n: "04",
          h: "專人送達府上",
          p: "保險專送、低調包裝、簽收交付，附終身鑑定卡。",
        },
      ],
    },
    hero: {
      eyebrow: "為慎重之物存在的代購工坊",
      sub: "VERDA 是專屬代購顧問，為您搜羅全球工坊的皮件、製錶與成衣。透明定價、嚴格鑑定，並由一位專屬顧問全程經手您的檔案。",
    },
    headline: {
      line1: "您本該",
      line2: "親自挑選的",
      line3: "衣櫃，",
      line4em: "現在\n交給我們。",
    },
  },
};
