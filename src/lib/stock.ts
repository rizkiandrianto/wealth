import type { StockHolding, StockMarket } from '@/lib/types'

export const IDX_LOT_SIZE = 100

export function sharesFor(market: StockMarket, quantity: number): number {
  return market === 'IDX' ? quantity * IDX_LOT_SIZE : quantity
}

export function stockShares(stock: Pick<StockHolding, 'market' | 'quantity'>): number {
  return sharesFor(stock.market, stock.quantity)
}
