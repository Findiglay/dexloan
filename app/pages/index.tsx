import * as anchor from "@project-serum/anchor";
import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Heading as DialogHeading,
  Header,
  Flex,
  Text,
  View,
} from "@adobe/react-spectrum";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useMutation } from "react-query";
import * as api from "../lib/api";
import { useListingsQuery } from "../hooks/query";
import { Card } from "../components/card";
import { ProgressCircle } from "../components/progress";
import { Body, Detail, Typography } from "../components/typography";

const Listings: NextPage = () => {
  const router = useRouter();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const queryResult = useListingsQuery(connection);

  const [selectedListing, setDialog] = useState<{
    publicKey: anchor.web3.PublicKey;
    account: {
      amount: anchor.BN;
      authority: anchor.web3.PublicKey;
      basisPoints: number;
      duration: anchor.BN;
      escrow: anchor.web3.PublicKey;
      mint: anchor.web3.PublicKey;
      state: number;
    };
  } | null>(null);

  const mutation = useMutation(
    () => {
      if (anchorWallet && selectedListing) {
        return api.createLoan(
          connection,
          anchorWallet,
          selectedListing.account.mint,
          selectedListing.account.authority,
          selectedListing.publicKey
        );
      }
      throw new Error("Not ready");
    },
    {
      onSuccess() {
        setDialog(null);
        router.push("/me");
      },
    }
  );

  if (queryResult.isLoading) {
    return <ProgressCircle />;
  }

  return (
    <>
      <Link href="/borrow">Borrow</Link>
      <Flex direction="row" width="100%" gap="size-100" wrap="wrap">
        {queryResult.data?.map(
          (item) =>
            item && (
              <Card
                key={item?.listing.publicKey?.toBase58()}
                uri={item.metadata.data?.data?.uri}
              >
                <Typography>
                  <Body>
                    <strong>{item.metadata.data?.data?.name}</strong>
                  </Body>
                  <Detail>
                    {item.listing.account.amount.toNumber() /
                      anchor.web3.LAMPORTS_PER_SOL}
                    &nbsp;SOL&nbsp;@&nbsp;
                    {item.listing.account.basisPoints / 100}%
                  </Detail>
                </Typography>
                <Divider />
                <Flex direction="row" justifyContent="end">
                  <ButtonGroup align="end">
                    <Button
                      variant="secondary"
                      marginY="size-200"
                      onPress={() =>
                        window.open(
                          `https://explorer.solana.com/address/${item.listing.account.mint.toBase58()}?cluster=devnet`,
                          "_blank"
                        )
                      }
                    >
                      View
                    </Button>
                    <Button
                      variant="cta"
                      marginY="size-200"
                      onPress={() => setDialog(item.listing)}
                    >
                      Lend
                    </Button>
                  </ButtonGroup>
                </Flex>
              </Card>
            )
        )}
      </Flex>
      <DialogContainer onDismiss={() => setDialog(null)}>
        {selectedListing && (
          <Dialog>
            {mutation.isLoading ? (
              <Content>
                <View height="size-400" width="100%">
                  <ProgressCircle />
                </View>
              </Content>
            ) : (
              <>
                <DialogHeading>Loan</DialogHeading>
                <Header>
                  Lending&nbsp;
                  <strong>
                    {selectedListing.account.amount.toNumber() /
                      anchor.web3.LAMPORTS_PER_SOL}{" "}
                    SOL
                  </strong>
                  &nbsp;@&nbsp;
                  <strong>
                    {selectedListing.account.basisPoints / 100}% APY
                  </strong>
                </Header>
                <Content>
                  <View>
                    <Text>
                      This loan may be repaid in full at any time. Interest will
                      be calulated on a pro-rata basis. If the borrower fails to
                      repay the loan, you may exercise the right to repossess
                      the NFT.
                    </Text>
                  </View>
                </Content>
                <Divider />
                <ButtonGroup>
                  <Button
                    isDisabled={mutation.isLoading}
                    variant="secondary"
                    onPress={() => setDialog(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    isDisabled={mutation.isLoading}
                    variant="cta"
                    onPress={() => mutation.mutate()}
                  >
                    Confirm
                  </Button>
                </ButtonGroup>
              </>
            )}
          </Dialog>
        )}
      </DialogContainer>
    </>
  );
};

export default Listings;
