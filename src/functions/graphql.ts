export const getMetafieldDefinitionQuery = `
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

export const createMetafieldDefinitionMutation = `
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

export const getOrderQuery = `
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

export const getOrderGatewayQuery = `
query getOrder($id: ID!) {
  order(id: $id) {
    paymentGatewayNames
  }
}
`;
