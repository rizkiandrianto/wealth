"use client";

// Required APIs:
//   GET    /api/accounts
//   GET    /api/transactions?accountId=[id]
//   PATCH  /api/accounts/[id]
//   DELETE /api/accounts/[id]

import { useEffect, useMemo, useState, use } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import AccountForm from "@/components/AccountForm";
import { useFormatCurrency, useFormatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Account, AccountType, Transaction } from "@/lib/types";
import {
  ACCOUNT_TYPE_ICONS,
  ACCOUNT_TYPE_COLORS,
} from "@/lib/accountTypeMeta";
import {
  accountsQueryOptions,
  useAccountsQuery,
  useUpdateAccount,
  useDeleteAccount,
} from "@/lib/queries/accounts";
import {
  transactionsQueryOptions,
  useTransactionsQuery,
} from "@/lib/queries/transactions";

interface TxListProps {
  transactions: Transaction[];
  account: Account;
  accounts: Account[];
  formatCurrency: (amount: number, currency?: string) => string;
  formatDateTime: (ts: number) => string;
}

function AccountTransactionList({
  transactions,
  account,
  accounts,
  formatCurrency,
  formatDateTime,
}: TxListProps) {
  const t = useTranslations("accountDetail");
  const tTx = useTranslations("transactions");
  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ArrowRight className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground">{t("noTransactions")}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-border">
        {transactions.map((tx) => {
          const isIncoming = tx.toAccountId === account.id;
          const counterpartId = isIncoming ? tx.fromAccountId : tx.toAccountId;
          const counterpart = counterpartId
            ? accounts.find((a) => a.id === counterpartId)
            : null;

          const counterpartName = counterpart
            ? counterpart.name
            : isIncoming
              ? tTx("topup")
              : tTx("withdrawal");

          const isTopupOrWithdrawal = !counterpart;

          const amountColor = isIncoming ? "text-green-600" : "text-orange-600";
          const amountPrefix = isIncoming ? "+" : "-";
          const label = isIncoming
            ? t("creditFrom", { name: counterpartName })
            : t("debitTo", { name: counterpartName });
          const finalLabel = isTopupOrWithdrawal ? counterpartName : label;

          return (
            <div
              key={tx.id}
              className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{finalLabel}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(tx.date)}
                  {tx.description && ` • ${tx.description}`}
                </p>
              </div>
              <p className={`text-lg font-bold ${amountColor}`}>
                {amountPrefix}
                {formatCurrency(tx.amount, account.currency)}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("accountDetail");
  const tAccounts = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const tDash = useTranslations("dashboard");
  const router = useRouter();
  const formatCurrency = useFormatCurrency();
  const formatDateTime = useFormatDateTime();
  const qc = useQueryClient();
  useEffect(() => {
    qc.prefetchQuery(accountsQueryOptions());
    qc.prefetchQuery(transactionsQueryOptions({ accountId: id }));
  }, [qc, id]);

  const { data: accounts = [], isLoading: accountsLoading } =
    useAccountsQuery();
  const { data: sortedTransactions = [], isLoading: txLoading } =
    useTransactionsQuery({
      accountId: id,
    });
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const account = useMemo(
    () => accounts.find((a) => a.id === id),
    [accounts, id],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (data: {
    name: string;
    type: AccountType;
    currency: string;
  }) => {
    if (!account) return;
    setIsSubmitting(true);
    try {
      await updateAccount.mutateAsync({ id: account.id, updates: data });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    setIsSubmitting(true);
    try {
      await deleteAccount.mutateAsync(account.id);
      setShowDeleteDialog(false);
      router.push("/accounts");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accountsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToAccounts")}
          </Link>
          <Card className="p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2">{t("notFound")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("notFoundHint")}
            </p>
            <Link href="/accounts">
              <Button>{t("backToAccounts")}</Button>
            </Link>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = ACCOUNT_TYPE_ICONS[account.type];
  const colorClass = ACCOUNT_TYPE_COLORS[account.type];
  const balance = account.balance;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link
          href="/accounts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToAccounts")}
        </Link>

        <Card className={`p-6 bg-linear-to-br ${colorClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-foreground" />
                <p className="text-sm font-medium text-muted-foreground capitalize">
                  {account.type}
                </p>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {account.name}
              </h1>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(Math.max(balance, 0), account.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {tAccounts("currency")}: {account.currency}
              </p>
            </div>

            {!isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {tCommon("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  {tCommon("delete")}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {isEditing && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{t("editTitle")}</h2>
            <AccountForm
              initialData={{
                name: account.name,
                type: account.type,
                currency: account.currency,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
            {isSubmitting && (
              <p className="text-sm text-muted-foreground mt-3">{tCommon("saving")}</p>
            )}
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">{tDash("recentTransactions")}</h2>
          {txLoading ? (
            <Card className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </Card>
          ) : (
            <AccountTransactionList
              transactions={sortedTransactions}
              account={account}
              accounts={accounts}
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={tAccounts("deleteConfirmTitle", { name: account.name })}
        description={tAccounts("deleteConfirmDescriptionFull")}
        confirmLabel={tCommon("delete")}
        loadingLabel={tCommon("deleting")}
        isLoading={isSubmitting}
        destructive
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
