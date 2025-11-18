import { $Enums, Prisma } from "@prisma/client";

export interface EncryptedPayload {
  token: string;
  iv: string;
  tag: string;
}

export interface MetafieldDefinition {
  id: string;
  name: string;
  namespace: string;
  key: string;
  type: {
    name: string;
  };
  ownerType: string;
}

interface PresentmentMoney {
  amount: string;
  currencyCode?: string;
}

interface PriceSet {
  presentmentMoney: PresentmentMoney;
}

interface TaxLine {
  ratePercentage: number;
}

interface ImageRef {
  url: string;
}

interface Variant {
  id: string;
  displayName: string;
  barcode: string;
  metafield: {
    value: string;
  };
}

interface LineItem {
  variant: Variant;
  quantity: number;
  originalUnitPriceSet: {
    presentmentMoney: {
      amount: string;
    };
  };
  discountedUnitPriceAfterAllDiscountsSet: {
    presentmentMoney: {
      amount: string;
    };
  };
  discountAllocations: {
    allocatedAmountSet: {
      presentmentMoney: {
        amount: string;
      };
    };
  }[];
  image: ImageRef;
  taxLines: TaxLine[];
}

interface LineItemsConnection {
  nodes: LineItem[];
}

export interface Order {
  id: string;
  totalPriceSet: {
    presentmentMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  currentTotalDiscountsSet: {
    presentmentMoney: {
      amount: string;
    };
  };
  customer: {
    defaultEmailAddress: {
      emailAddress: string | null;
    };
  };
  lineItems: LineItemsConnection;
}

type DiscountType = "DISCOUNT" | "EXTRA_CHARGE";
type DiscountMode = "PERCENT" | "VALUE";

export interface Discount {
  type: DiscountType;
  mode: DiscountMode;
  value: number;
}

export interface Body {
  cardToken?: string;
  amount: number;
  ccy: number;
  initiationKind?: "merchant" | "client";
  merchantPaymInfo: {
    reference: string;
    destination?: string;
    comment?: string;
    discounts?: Discount[];
    customerEmails?: string[];
    basketOrder: {
      name: string;
      qty: number;
      sum: number;
      total: number;
      icon: string;
      unit: string;
      code: string;
      barcode: string;
      header?: string | null;
      footer?: string | null;
      tax: number[];
      uktzed: string | null;
      splitReceiverId?: string | null;
      discounts?: Discount[];
    }[];
  };
  redirectUrl: string;
  successUrl?: string;
  failUrl?: string;
  webHookUrl: string | null;
  validity: number;
  paymentType: string;
  qrId?: string | null;
  code?: string | null;
  saveCardData: {
    saveCard: boolean;
    walletId: string;
  };
  agentFeePercent?: number | null;
  tipsEmployeeId?: string | null;
  displayType?: string | null;
}

export interface OrderGateways {
  paymentGatewayNames: string[];
}

type TxStatus = "created" | "processing" | "hold" | "success" | "failure" | "reversed";

type TxCancelStatus = "processing" | "success" | "failure";

type paymentSystem = "visa" | "mastercard";

type paymentMethod = "pan" | "apple" | "google" | "monobank" | "wallet" | "direct";

type walletStatus = "new" | "created" | "failed";

export interface Transaction {
  invoiceId: string;
  status: TxStatus;
  failureReason: string;
  errCode: string;
  amount: number;
  ccy: number;
  finalAmount: number;
  createdDate: Date;
  modifiedDate: Date;
  reference: string;
  destination: string;
  cancelList: [
    {
      status: TxCancelStatus;
      amount: number;
      ccy: number;
      createdDate: Date;
      modifiedDate: Date;
      approvalCode: string;
      rrn: string;
      extRef: string;
    }
  ];
  paymentInfo: {
    maskedPan: string;
    approvalCode: string;
    rrn: string;
    tranId: string;
    terminal: string;
    bank: string;
    paymentSystem: paymentSystem;
    paymentMethod: paymentMethod;
    fee: number | null;
    country: string;
    agentFee: number | null;
  };
  walletData: {
    cardToken: string;
    walletId: string;
    status: walletStatus;
  };
  tipsInfo: {
    employeeId: string | null;
    amount: number;
  };
}

export interface TransactionWithSuccessPayload {
  id: string;
  invoiceId: string;
  orderId: string;
  total: Prisma.Decimal;
  currency: number;
  currentStatus: $Enums.TxStatus;
  currentModified: Date;
  createdAt: Date;
  updatedAt: Date;
  cardToken: string | null;
  merchantId: string;
  payload: Prisma.JsonValue | null;
}

export type MerchantWithCronTasks = Prisma.MerchantGetPayload<{
  include: {
    transactions: {
      include: {
        cronTasks: true;
      };
    };
  };
}>;
