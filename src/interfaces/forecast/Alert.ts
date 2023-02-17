interface Alert {
  id: string;
  event: string;
  headline: string;
  description: string;
  ends: string;
  endsEpoch: number;
  link: string;
}

export default Alert;
