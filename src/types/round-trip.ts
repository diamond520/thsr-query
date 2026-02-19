export interface RoundTripParams {
  origin: string       // TDX StationID e.g. "1"
  destination: string  // TDX StationID e.g. "12"
  outboundDate: string // YYYY-MM-DD format
  returnDate: string   // YYYY-MM-DD format
}
