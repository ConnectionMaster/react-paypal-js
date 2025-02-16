import React, { useState, useEffect, ReactElement } from "react";
import type { FC } from "react";

import type { PayPalScriptOptions } from "@paypal/paypal-js/types/script-options";
import type { OnApproveBraintreeData } from "../types";

import { PayPalScriptProvider, BraintreePayPalButtons } from "../index";
import {
    getOptionsFromQueryString,
    generateRandomString,
    getClientToken,
    approveSale,
} from "./utils";

const uid = generateRandomString();
const AMOUNT = "10.0";
const scriptProviderOptions: PayPalScriptOptions = {
    "client-id": "test",
    components: "buttons",
    ...getOptionsFromQueryString(),
};

export default {
    title: "Example/BraintreePayPalButtons",
    component: BraintreePayPalButtons,
    argTypes: {
        style: { control: null },
    },
    args: {
        // Storybook passes empty functions by default for props like `onShippingChange`.
        // This turns on the `onShippingChange()` feature which uses the popup experience with the Standard Card button.
        // We pass null to opt-out so the inline guest feature works as expected with the Standard Card button.
        onShippingChange: null,
    },
    decorators: [
        (
            Story: FC,
            args: { originalStoryFn: { name: string } }
        ): ReactElement => {
            // Workaround to render the story after got the client token,
            // The new experimental loaders doesn't work in Docs views
            const [clientToken, setClientToken] = useState<string | null>(null);

            useEffect(() => {
                (async () => {
                    setClientToken(await getClientToken());
                })();
            }, []);

            return (
                <div style={{ minHeight: "200px" }}>
                    {clientToken != null && (
                        <>
                            <PayPalScriptProvider
                                options={{
                                    ...scriptProviderOptions,
                                    "data-client-token": clientToken,
                                    "data-namespace": uid,
                                    "data-uid": uid,
                                    vault:
                                        args.originalStoryFn.name ===
                                        BillingAgreement.name,
                                }}
                            >
                                <Story />
                            </PayPalScriptProvider>
                        </>
                    )}
                </div>
            );
        },
    ],
};

export const Default: FC = () => {
    return (
        <BraintreePayPalButtons
            createOrder={(data, actions) =>
                actions.braintree.createPayment({
                    flow: "checkout",
                    amount: AMOUNT,
                    currency: "USD",
                    intent: "capture",
                    enableShippingAddress: true,
                    shippingAddressEditable: false,
                    shippingAddressOverride: {
                        recipientName: "Scruff McGruff",
                        line1: "1234 Main St.",
                        line2: "Unit 1",
                        city: "Chicago",
                        countryCode: "US",
                        postalCode: "60652",
                        state: "IL",
                        phone: "123.456.7890",
                    },
                })
            }
            onApprove={(data, actions) =>
                actions.braintree
                    .tokenizePayment(data as OnApproveBraintreeData)
                    .then((payload) => {
                        approveSale(payload.nonce, AMOUNT).then((data) => {
                            alert(JSON.stringify(data));
                            // Call server-side endpoint to finish the sale
                        });
                    })
            }
        />
    );
};

export const BillingAgreement: FC = () => {
    return (
        <BraintreePayPalButtons
            createBillingAgreement={(data, actions) =>
                actions.braintree.createPayment({
                    flow: "vault", // Required

                    // The following are optional params
                    billingAgreementDescription: "Your agreement description",
                    enableShippingAddress: true,
                    shippingAddressEditable: false,
                    shippingAddressOverride: {
                        recipientName: "Scruff McGruff",
                        line1: "1234 Main St.",
                        line2: "Unit 1",
                        city: "Chicago",
                        countryCode: "US",
                        postalCode: "60652",
                        state: "IL",
                        phone: "123.456.7890",
                    },
                })
            }
            onApprove={(data, actions) =>
                actions.braintree
                    .tokenizePayment(data as OnApproveBraintreeData)
                    .then((payload) => {
                        approveSale(payload.nonce, AMOUNT).then((data) => {
                            alert(JSON.stringify(data));
                            // Call server-side endpoint to finish the sale
                        });
                    })
            }
        />
    );
};
