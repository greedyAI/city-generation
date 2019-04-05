class ExpansionRule {
  rules: Map<string, number>;

  constructor(rules: Map<string, number>) {
    this.rules = rules;
  }

  chooseRandomRule() {
    let random: number = Math.random();
    let sumSoFar: number = 0;
    let keySoFar: string = "";
    this.rules.forEach((value: number, key: string) => {
      keySoFar = key;
      if (random < sumSoFar + value) {
        return key;
      }
      sumSoFar += value;
    });
    return keySoFar;
  }
}

export default ExpansionRule;
