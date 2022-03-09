import * as anchor from "@project-serum/anchor";
import {
  Button,
  Divider,
  Flex,
  StatusLight,
  View,
  Link as SpectrumLink,
} from "@adobe/react-spectrum";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import type { NextPage } from "next";
import { useState } from "react";
import * as utils from "../utils";
import {
  useLoansQuery,
  useBorrowingsQuery,
  useListingsByOwnerQuery,
} from "../hooks/query";
import {
  useCancelMutation,
  useRepaymentMutation,
  useRepossessMutation,
} from "../hooks/mutation";
import { ConnectWalletButton } from "../components/button";
import { Card, CardFlexContainer } from "../components/card";
import { LoadingPlaceholder } from "../components/progress";
import { Typography, Body, Heading } from "../components/typography";
import { Main } from "../components/layout";
import {
  CancelDialog,
  RepayDialog,
  RepossessDialog,
} from "../components/dialog";

const Manage: NextPage = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const loansQueryResult = useLoansQuery(connection, anchorWallet);
  const borrowingsQueryResult = useBorrowingsQuery(connection, anchorWallet);
  const listingsQueryResult = useListingsByOwnerQuery(connection, anchorWallet);
  console.log({
    loansQueryResult: loansQueryResult.data?.map((l) =>
      l?.listing.publicKey.toBase58()
    ),
    borrowingsQueryResult: borrowingsQueryResult.data?.map((l) =>
      l?.listing.publicKey.toBase58()
    ),
    listingsQueryResult: listingsQueryResult.data?.map((l) =>
      l?.listing.publicKey.toBase58()
    ),
  });
  if (!anchorWallet) {
    return (
      <Flex direction="row" justifyContent="center">
        <View marginY="size-2000">
          <ConnectWalletButton />
        </View>
      </Flex>
    );
  }

  if (
    loansQueryResult.isLoading ||
    borrowingsQueryResult.isLoading ||
    listingsQueryResult.isLoading
  ) {
    return <LoadingPlaceholder />;
  }

  return (
    <>
      <Main>
        {loansQueryResult.data?.length ? (
          <>
            <View marginBottom="size-200" marginTop="size-600">
              <Typography>
                <Heading>Your Loans</Heading>
              </Typography>
            </View>
            <CardFlexContainer>
              {loansQueryResult.data?.map(
                (item) =>
                  item && (
                    <LoanCard
                      key={item.listing.publicKey?.toBase58()}
                      amount={item.listing.account.amount.toNumber()}
                      basisPoints={item.listing.account.basisPoints}
                      duration={item.listing.account.duration.toNumber()}
                      name={item.metadata.data?.data?.name}
                      escrow={item.listing.account.escrow}
                      listing={item.listing.publicKey}
                      mint={item.listing.account.mint}
                      startDate={item.listing.account.startDate.toNumber()}
                      uri={item.metadata.data?.data?.uri}
                    />
                  )
              )}
            </CardFlexContainer>
          </>
        ) : null}
        {borrowingsQueryResult.data?.length ? (
          <>
            <View marginBottom="size-200" marginTop="size-600">
              {loansQueryResult.data?.length ? <Divider size="M" /> : null}
              <Typography>
                <Heading>Your Borrowings</Heading>
              </Typography>
            </View>
            <CardFlexContainer>
              {borrowingsQueryResult.data?.map(
                (item) =>
                  item && (
                    <BorrowingCard
                      key={item.listing.publicKey.toBase58()}
                      amount={item.listing.account.amount.toNumber()}
                      basisPoints={item.listing.account.basisPoints}
                      duration={item.listing.account.duration.toNumber()}
                      name={item.metadata.data.data.name}
                      escrow={item.listing.account.escrow}
                      lender={item.listing.account.lender}
                      listing={item.listing.publicKey}
                      mint={item.listing.account.mint}
                      startDate={item.listing.account.startDate.toNumber()}
                      uri={item.metadata.data.data.uri}
                    />
                  )
              )}
            </CardFlexContainer>
          </>
        ) : null}
        {listingsQueryResult.data?.length ? (
          <>
            <View marginBottom="size-200" marginTop="size-600">
              {borrowingsQueryResult.data?.length ? <Divider size="M" /> : null}
              <Typography>
                <Heading>Listed</Heading>
              </Typography>
            </View>
            <CardFlexContainer>
              {listingsQueryResult.data?.map(
                (item) =>
                  item && (
                    <ListedCard
                      key={item.listing.publicKey?.toBase58()}
                      amount={item.listing.account.amount.toNumber()}
                      basisPoints={item.listing.account.basisPoints}
                      duration={item.listing.account.duration.toNumber()}
                      escrow={item.listing.account.escrow}
                      listing={item.listing.publicKey}
                      name={item.metadata.data?.data?.name}
                      mint={item.listing.account.mint}
                      uri={item.metadata.data?.data?.uri}
                    />
                  )
              )}
            </CardFlexContainer>
          </>
        ) : null}
      </Main>
    </>
  );
};

interface LoanCardProps {
  amount: number;
  name: string;
  escrow: anchor.web3.PublicKey;
  listing: anchor.web3.PublicKey;
  mint: anchor.web3.PublicKey;
  basisPoints: number;
  duration: number;
  startDate: number;
  uri: string;
}

const LoanCard: React.FC<LoanCardProps> = ({
  amount,
  basisPoints,
  duration,
  escrow,
  listing,
  mint,
  name,
  startDate,
  uri,
}) => {
  const [dialog, setDialog] = useState(false);
  const mutation = useRepossessMutation(() => setDialog(false));

  return (
    <>
      <Card uri={uri}>
        <Typography>
          <Heading size="S">{name}</Heading>
          <Body size="S">
            Lending&nbsp;
            <strong>
              {amount / anchor.web3.LAMPORTS_PER_SOL}
              &nbsp;SOL
            </strong>
            &nbsp;for&nbsp;
            {utils.toMonths(duration)}
            &nbsp;months&nbsp;@&nbsp;
            <strong>{basisPoints / 100}%</strong>
            &nbsp;APY.&nbsp;
            <SpectrumLink>
              <a
                href={`https://explorer.solana.com/address/${mint}`}
                target="_blank"
                rel="noreferrer"
              >
                View in Explorer
              </a>
            </SpectrumLink>
          </Body>
        </Typography>
        <Divider size="S" marginTop="size-600" />
        <Flex direction="row" justifyContent="end">
          {utils.hasExpired(startDate, duration) ? (
            <Button
              marginY="size-200"
              variant="primary"
              onPress={() => setDialog(false)}
            >
              Repossess
            </Button>
          ) : (
            <StatusLight
              marginY="size-200"
              marginX="size-50"
              variant="positive"
            >
              {utils.yieldGenerated(amount, startDate, basisPoints).toFixed(4)}{" "}
              SOL earned - due {utils.getFormattedDueDate(startDate, duration)}
            </StatusLight>
          )}
        </Flex>
      </Card>
      <RepossessDialog
        open={dialog}
        loading={mutation.isLoading}
        onConfirm={() =>
          mutation.mutate({
            escrow,
            listing,
            mint,
          })
        }
        onRequestClose={() => setDialog(false)}
      />
    </>
  );
};

interface BorrowingCardProps {
  amount: number;
  name: string;
  escrow: anchor.web3.PublicKey;
  lender: anchor.web3.PublicKey;
  listing: anchor.web3.PublicKey;
  mint: anchor.web3.PublicKey;
  basisPoints: number;
  duration: number;
  startDate: number;
  uri: string;
}

const BorrowingCard: React.FC<BorrowingCardProps> = ({
  amount,
  name,
  basisPoints,
  duration,
  escrow,
  lender,
  listing,
  mint,
  startDate,
  uri,
}) => {
  const [dialog, setDialog] = useState(false);
  const mutation = useRepaymentMutation(() => setDialog(false));

  return (
    <>
      <Card uri={uri}>
        <Typography>
          <Heading size="S">{name}</Heading>
          <Body size="S">
            Borrowing&nbsp;
            <strong>
              {amount / anchor.web3.LAMPORTS_PER_SOL}
              &nbsp;SOL
            </strong>
            &nbsp;for&nbsp;
            {utils.toMonths(duration)}
            &nbsp;months&nbsp;@&nbsp;
            <strong>{basisPoints / 100}%</strong>
            &nbsp;APY.&nbsp;
            <SpectrumLink>
              <a
                href={`https://explorer.solana.com/address/${mint}`}
                target="_blank"
                rel="noreferrer"
              >
                View in Explorer
              </a>
            </SpectrumLink>
          </Body>
        </Typography>
        <Divider size="S" marginTop="size-600" />
        <Flex direction="row" justifyContent="right">
          <Button
            marginY="size-200"
            variant="primary"
            onPress={() => setDialog(true)}
          >
            Repay {utils.totalAmount(amount, startDate, basisPoints).toFixed(4)}
          </Button>
        </Flex>
      </Card>
      <RepayDialog
        open={dialog}
        loading={mutation.isLoading}
        onConfirm={() =>
          mutation.mutate({
            escrow,
            lender,
            listing,
            mint,
          })
        }
        onRequestClose={() => setDialog(false)}
      />
    </>
  );
};

interface ListingCardProps {
  amount: number;
  basisPoints: number;
  duration: number;
  name: string;
  escrow: anchor.web3.PublicKey;
  listing: anchor.web3.PublicKey;
  mint: anchor.web3.PublicKey;
  uri: string;
}

const ListedCard: React.FC<ListingCardProps> = ({
  amount,
  basisPoints,
  duration,
  escrow,
  listing,
  mint,
  name,
  uri,
}) => {
  const [dialog, setDialog] = useState(false);
  const mutation = useCancelMutation(() => setDialog(false));

  return (
    <>
      <Card uri={uri}>
        <Typography>
          <Heading size="S">{name}</Heading>
          <Body size="S">
            Borrowing&nbsp;
            <strong>
              {amount / anchor.web3.LAMPORTS_PER_SOL}
              &nbsp;SOL
            </strong>
            &nbsp;for&nbsp;
            {utils.toMonths(duration)}
            &nbsp;months&nbsp;@&nbsp;
            <strong>{basisPoints / 100}%</strong>
            &nbsp;APY.&nbsp;
            <SpectrumLink>
              <a
                href={`https://explorer.solana.com/address/${mint}`}
                target="_blank"
                rel="noreferrer"
              >
                View in Explorer
              </a>
            </SpectrumLink>
          </Body>
        </Typography>
        <Divider size="S" marginTop="size-600" />
        <Flex direction="row" justifyContent="right">
          <Button
            marginY="size-200"
            variant="primary"
            onPress={() =>
              mutation.mutate({
                escrow,
                listing,
                mint,
              })
            }
          >
            Cancel
          </Button>
        </Flex>
      </Card>
      <CancelDialog
        open={dialog}
        loading={mutation.isLoading}
        onConfirm={() =>
          mutation.mutate({
            escrow,
            listing,
            mint,
          })
        }
        onRequestClose={() => setDialog(false)}
      />
    </>
  );
};

export default Manage;
