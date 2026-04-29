type SheetEntry = {
  shift: string;
  machine: string;
  inputWeight: number;
  outputWeight: number;
  waste: number;
  operatorName: string;
  date: string;
};


type MDOEntry = {
  shift: string;
  machine: string;
  inputRollNumber: string;
  inputWeight: number;
  outputWeight: number;
  rejection: number;
  stretchRatio: number;
  date: string;
};


type SlitterEntry = {
  shift: string;
  machine: string;

  inputRollNumber: string;
  inputWeight: number;

  numberOfSlits: number; // how many cuts
  slitWidth: number;     // width of each

  totalOutputWeight: number; // combined pancakes
  waste: number;

  rejection?: number;

  date: string;
};  