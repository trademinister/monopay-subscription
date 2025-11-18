"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderGatewayQuery = exports.getOrderQuery = exports.createMetafieldDefinitionMutation = exports.getMetafieldDefinitionQuery = void 0;
exports.getMetafieldDefinitionQuery = `
query getMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) {
  metafieldDefinition(identifier: $identifier) {
    id
    name
    namespace
    key
    type {
      name
    }
    ownerType
  }
}
`;
exports.createMetafieldDefinitionMutation = `
mutation createMetafieldDefinition($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      name
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;
exports.getOrderQuery = `
query getOrder($id: ID!) {
  order(id: $id) {
    id
    totalPriceSet {
      presentmentMoney {
        amount
        currencyCode
      }
    }
    currentTotalDiscountsSet {
      presentmentMoney {
        amount
      }
    }
    customer {
      defaultEmailAddress {
        emailAddress
      }
    }
    lineItems(first: 250) {
      nodes {
        variant {
          id
          displayName
          barcode
          metafield(key:"uktzed", namespace:"copycon") {
            value
          }
        }
        quantity
        originalUnitPriceSet {
          presentmentMoney {
            amount
          }
        }
        discountedUnitPriceAfterAllDiscountsSet {
          presentmentMoney {
            amount
          }
        }
        discountAllocations {
          allocatedAmountSet {
            presentmentMoney {
              amount
            }
          }
        }
        image {
          url
        }
        taxLines {
        ratePercentage
        }
      }
    }
  }
}
`;
exports.getOrderGatewayQuery = `
query getOrder($id: ID!) {
  order(id: $id) {
    paymentGatewayNames
  }
}
`;
