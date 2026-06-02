export class ReservationFailedEvent {
  constructor(
    public readonly userId: string,
    public readonly scheduleId: string,
    public readonly studentId: string,
    public readonly transactionId: string,
    public readonly reason: string,
    // True when the reservation failed because the class was already full — these
    // require a refund, not a manual seat assignment.
    public readonly classFull: boolean,
  ) {}
}
