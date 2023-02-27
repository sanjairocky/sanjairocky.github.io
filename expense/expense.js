const parseCsv = ({ csvString }) => {
  const data = CSVToArray(csvString, ",");
  if (
    JSON.stringify(data[0]) !==
    JSON.stringify([
      "Record Type",
      "Description",
      "Total Amount",
      "Person Name",
      "Person Shared",
    ])
  )
    throw new Error("Input file is invalid");
  let records = 0;
  let personCount = 0;
  let budget = 0;
  const expenses = Object.values(
    data
      .slice(1)
      .filter(([a]) => ["E", "P"].includes(a))
      .map((data) => {
        if (data?.[0] === "E") records++;
        return [records, ...data];
      })
      .reduce((acc, cur) => {
        if (cur?.[1] === "E") {
          acc[cur?.[0]] = {
            id: cur?.[0],
            description: cur?.[2],
            totalAmount: parseFloat(cur?.[3]) || 0.0,
            persons: {},
            ...acc[cur?.[0]],
          };
          personCount = 0;
          budget += acc[cur?.[0]].totalAmount;
        } else {
          acc[cur?.[0]].persons[cur?.[4]] = parseFloat(cur?.[5]) || 0.0;
          acc[cur?.[0]].personCount = ++personCount;
        }
        return acc;
      }, {})
  ).map((exp) => ({
    ...exp,
    balance: Object.fromEntries(
      Object.entries(exp.persons).map(([k, v]) => [
        k,
        round(v - exp.totalAmount / exp.personCount),
      ])
    ),
  }));
  const persons = Object.fromEntries(
    Object.entries(
      expenses.reduce((acc, cur) => {
        Object.keys(cur?.balance || {}).forEach((k) => {
          if (!acc[k]) {
            acc[k] = {
              spent: 0.0,
              amount: 0.0,
              share: 0.0,
            };
          }
          acc[k].amount += cur.balance[k];
          acc[k].spent += cur.persons[k];
          acc[k].share += cur.totalAmount / cur.personCount;
        });

        return acc;
      }, {})
    ).map(([k, v]) => [
      k,
      {
        ...v,
        spent: round(v.spent),
        amount: round(v.amount),
        share: round(v.share),
      },
    ])
  );

  const separatePersons = (persons) => {
    const { lenders, owers } = Object.entries(persons).reduce(
      (acc, [k, v]) => {
        if (v.amount > 0.0)
          acc.lenders.push({ username: k, ...v, deposit: v.amount });
        else acc.owers.push({ username: k, ...v, balance: -1 * v.amount });
        return acc;
      },
      { lenders: [], owers: [] }
    );
    return { owers, lenders };
  };

  const balanceTransactions = (persons) => {
    const { owers, lenders } = separatePersons(persons);
    const balanceSheet = [];
    owers.forEach((ower) => {
      const from = ower.username;
      lenders.every((lender) => {
        const to = lender.username;
        if (lender.deposit) {
          const hasToPay = Math.min(lender.deposit, ower.balance);
          if (hasToPay) {
            ower.balance -= hasToPay;
            lender.deposit -= hasToPay;
            balanceSheet.push({ from, hasToPay, to });
          }
        }
        return ower.balance;
      });
    });
    return balanceSheet.map(({ hasToPay, ...obj }) => ({
      ...obj,
      amount: round(hasToPay),
    }));
  };
  const result = {
    budget,
    persons,
    transactions: balanceTransactions(persons),
    expenses,
  };
  return result;
};
