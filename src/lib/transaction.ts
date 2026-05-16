import { Transaction } from "./types";

export function getTransactionSymbol(tx: Transaction) {
    if (tx.fromAccountId && !tx.toAccountId) {
        return '-';
    }

    if (!tx.fromAccountId && tx.toAccountId) {
        return '+';
    }

    return '';
}

export function getTransactionTextColor(tx: Transaction) {
    if (!tx.fromAccountId && tx.toAccountId) {
        return 'text-green-600';
    }

    if (tx.fromAccountId && !tx.toAccountId) {
        return 'text-orange-600';
    }

    return 'text-foreground';
}