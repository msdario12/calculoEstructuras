const tablaKD = {
  H20: [
    1.218, 0.89, 0.749, 0.668, 0.615, 0.577, 0.548, 0.525, 0.507, 0.492, 0.479,
    0.469,
  ],
  H25: [
    1.089, 0.796, 0.67, 0.598, 0.55, 0.516, 0.49, 0.47, 0.453, 0.44, 0.429,
    0.419,
  ],
  H30: [
    0.994, 0.727, 0.612, 0.546, 0.502, 0.471, 0.447, 0.429, 0.414, 0.402, 0.391,
    0.383,
  ],
  ke: [
    24.301, 24.766, 25.207, 26.625, 26.021, 26.399, 26.758, 27.1, 27.427,
    27.739, 28.038, 28.324,
  ],
  Ec: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  Et: [60, 30, 20, 15, 12, 10, 8.57, 7.5, 6.67, 6, 5.45, 5],
  kc: [
    0.048, 0.091, 0.13, 0.167, 0.2, 0.231, 0.259, 0.286, 0.31, 0.333, 0.355,
    0.375,
  ],
  kz: [
    0.98, 0.961, 0.945, 0.929, 0.915, 0.902, 0.89, 0.879, 0.868, 0.858, 0.849,
    0.841,
  ],
};
// Precios extraidos de la pagina de nimat.com.ar, marca acindar, dia 02/03/2023
const tablaPreciosBarras = {
  6: 1303.17,
  8: 2215.72,
  10: 3459.13,
  12: 4958.2,
  16: 8654.22,
  20: 13553.43,
  25: 21154.32,
};
const linearInterpolation = (index1, index2, key, H, kdCalc) => {
  let kd1 = tablaKD[H][index1];
  let kd2 = tablaKD[H][index2];
  let k1 = tablaKD[key][index1];
  let k2 = tablaKD[key][index2];

  const keC = k2 + ((k1 - k2) * (kd2 - kdCalc)) / (kd2 - kd1);
  // console.log('Valor de interpolacion - ',key, keC)
  return keC;
};

const obtenerKeDeTabla = (kdCalc, H, tabla) => {
  for (value of tabla[H]) {
    // Buscamos el inmediato inferior
    if (kdCalc >= value) {
      const arrayValues = ["ke", "Ec", "Et", "kc", "kz"];
      let output = {};
    //   Consultamos si el valor de kd calculado es mayor al maximo de la tabla
      if (kdCalc >= tabla[H][0]) {
        console.log('Se recomienda disminuir la altura d');
        for (const value of arrayValues) {
            output = {
                ...output,
                [value]: tabla[value][0]
            }
        }
        console.log('output', output)
        return output;
        }
      // Obtenemos el index del inmediato inferior como 1 y el superior como 2
      let index1 = tabla[H].indexOf(value);
      let index2 = tabla[H].indexOf(value) - 1;
      
      for (const value of arrayValues) {
        output = {
          ...output,
          [value]: linearInterpolation(index1, index2, value, H, kdCalc),
        };
      }
      return output;
    }

  }
  
};
const calcArea = (diam) => (Math.PI * (diam / 10) ** 2) / 4;
const calcCantbarras = (Abarra, AsNec) => Math.ceil(AsNec / Abarra);

// Se podria crear una funcion para determinar la cantidad de barras minimas recomendables en funcion de las dimensiones de la viga. Con esto, podemos trabajar usando primero solo 2 diametro contiguos para determinar varias combinaciones. Posteriormente en caso de vigas con dimensiones muy grandes podemos mezclar 3 diametros y ampliar la solucion.

const calculateNumberBars = (aNec) => {
  const output = [];
  const arrayDiam = [6, 8, 10, 12, 16, 20, 25];
  for (let i = 1; i < arrayDiam.length; i++) {
    // Funcion para poner las combinaciones que verifican en un array
    const pushResults = () => {
      output.push({
        numDiam1: numB2,
        diam1: arrayDiam[i - 1],
        numDiam2: numB1,
        diam2: arrayDiam[i],
        aprov: (aNec * 100) / areaTot,
        areaTot: areaTot,
        numBarrTotal: numB1 + numB2,
        price: calculatePrice(numB2, arrayDiam[i - 1], numB1, arrayDiam[i]),
      });
    };
    // Usando solamente un diametro
    let areaTot = 0;
    let numB1 = 2;
    let numB2 = 0;
    while (areaTot <= aNec) {
      areaTot = numB1 * calcArea(arrayDiam[i]);
      if (areaTot >= aNec) {
        // Hacer algo para el caso en que verifica
        pushResults();
      }
      numB1++;
    }
    // Usando 2 diámetros distintos
    numB1 = 2;
    areaTot = 0;
    while (areaTot <= aNec) {
      areaTot = numB1 * calcArea(arrayDiam[i]);
      if (areaTot >= aNec) {
        // No hacer nada y salir del while
        break;
      }
      let areaSingleB2 = calcArea(arrayDiam[i - 1]);
      let areaNecB2 = aNec - areaTot;
      numB2 = calcCantbarras(areaSingleB2, areaNecB2);
      areaTot = areaTot + numB2 * areaSingleB2;
      if (areaTot >= aNec) {
        // Hacer algo para el caso en que verifica
        pushResults();
      }
      numB1++;
    }
  }
  return output;
};

const barrasTotales = (aNec, maxCantBarras) => {
  const resultado = calculateNumberBars(aNec);
  console.log(resultado, "resultado");
  resultado.sort((a, b) => b.aprov - a.aprov);
  resultado.sort((a, b) => a.numBarrTotal - b.numBarrTotal);
  return resultado.filter(
    (comb) => comb.numDiam1 + comb.numDiam2 <= maxCantBarras && comb.aprov >= 70
  );
};
// Se espera que las unidades sean (cm, cm,kN, KNcm, 'H25', cm)
const calculoViga = (vars) => {
  const { anchoB, altoH, Nu, Mu, H, rec } = vars;
  const b = anchoB;
  const h = altoH;
  const facSeg = 0.9;
  const Nn = Nu / 1000 / facSeg;
  const Mn = Mu / 100000 / facSeg;
  const d = h - rec;
  const ye = h / 2 - rec;
  const Men = Mn - Nn * (ye / 100);
  const kdCalc = d / 100 / Math.sqrt(Men / (b / 100));
  // console.log(b, h,'Valores de calculo',Nn, Mn, d, ye, 'Men',Men, 'kdCalc',kdCalc)
  let objTabla = obtenerKeDeTabla(kdCalc, H, tablaKD);
  // Calculo de armadura necesaria
  const AsNec = objTabla.ke * (Men / (d / 100)) + (Nn * 10000) / 420;
  // Agregamos el valor de AsNec al objeto de resultados
  objTabla = { ...objTabla, AsNec };
  // Llamamos a la funcion encargada de mostrar los resultados
  cargarResultadosTabla(objTabla);
  console.log("Armadura necesaria: ", AsNec, "cm2");
  // Llamamos a la funcion que en base al AreaNec calcula las combinaciones de barras que cumplan
  let objBarras = barrasTotales(AsNec, 20);
  // Convertimos los valores para pasarlos en forma de Array
  const arrayBarras = [];
  for (const obj of objBarras) {
    arrayBarras.push(createRow(createArrayCombBarras(obj)));
  }
  cargarBarrasTabla(arrayBarras);
};

// Interaccion con el DOM, obtengo elementos
const inputAnchoB = document.getElementById("anchoB");
const inputAltoH = document.getElementById("altoH");
const inputRec = document.getElementById("rec");
const inputNu = document.getElementById("Nu");
const inputMu = document.getElementById("Mu");
const inputH = document.getElementById("calidadH");
const btnCalc = document.getElementById("btnCalcular");

const outputTablaContainer = document.getElementById("tablaContainer");

const output = document.getElementById("resultado1");

// Defino variables iniciales en un objeto
let vars = {
  anchoB: 20,
  altoH: 50,
  Nu: 100,
  Mu: 10000,
  H: "H20",
  rec: 3.5,
};

// Leo los valores de los inputs y los guardo en un objeto con todas las variables

inputAnchoB.onchange = function (e) {
  vars.anchoB = e.target.value;
  output.innerHTML = vars.anchoB;
};
inputAltoH.onchange = function (e) {
  vars.altoH = e.target.value;
  output.innerHTML = vars.altoH;
};
inputRec.onchange = function (e) {
  vars.rec = e.target.value;
  output.innerHTML = vars.rec;
};
inputNu.onchange = function (e) {
  vars.Nu = e.target.value;
  output.innerHTML = vars.Nu;
};
inputMu.onchange = function (e) {
  vars.Mu = e.target.value;
  output.innerHTML = vars.Mu;
};
inputH.onchange = function (e) {
  vars.H = e.target.value;
  output.innerHTML = vars.H;
};

btnCalc.onclick = () => calculoViga(vars);

const createRow = (array, type = "td") => {
  // The array is a array of content of the row [col1, col2, ...]
  let newRow = document.createElement("tr");
  for (const value of array) {
    const node = document.createTextNode(value);
    const newTH = document.createElement(type);
    newTH.appendChild(node);
    newRow.appendChild(newTH);
  }
  return newRow;
  // console.log(newRow)
};

const createTable = (arrayOfRows) => {
  const newTable = document.createElement("table");
  const newTHead = document.createElement("thead");
  const newTBody = document.createElement("tbody");
  // Using the first element of the array as head of the table
  const headRow = arrayOfRows.shift();
  newTHead.appendChild(headRow);
  // The rest of content is in of body of the table
  for (const row of arrayOfRows) {
    newTBody.appendChild(row);
  }
  newTable.appendChild(newTHead);
  newTable.appendChild(newTBody);
  // console.log(newTable)
  return newTable;
};

const redondear = (value, digits) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

const cargarResultadosTabla = (obj) => {
  // Reset the state of the table
  outputTablaContainer.innerHTML = "";
  const { ke, Ec, Et, kc, kz, AsNec } = obj;
  const rowHead = createRow(["Nombre", "Valor", "Unidad"], "th");
  const arrayRows = [];
  for (const val in obj) {
    arrayRows.push(createRow([val, redondear(obj[val], 3), ""]));
  }
  const newTable = createTable([rowHead, ...arrayRows]);
  outputTablaContainer.appendChild(newTable);
};

const calculatePrice = (numDiam1, diam1, numDiam2, diam2) => {
  return (
    (numDiam1 * tablaPreciosBarras[diam1]) / 12 +
    (numDiam2 * tablaPreciosBarras[diam2]) / 12
  );
};

const createArrayCombBarras = (objComb) => {
  // objComb = {};
  // El resultado tendria que ser apto para pasarlo a la funcion que crea las filas de la tabla
  // output = [2Ø16+2Ø10, valorAreaTotal, %aprovechamiento]
  const compName1 = objComb.numDiam2
    ? `${objComb.numDiam2}Ø${objComb.diam2}`
    : "";
  const compName2 = objComb.numDiam1
    ? `+${objComb.numDiam1}Ø${objComb.diam1}`
    : "";
  return [
    compName1 + compName2,
    redondear(objComb.areaTot, 3),
    redondear(objComb.numBarrTotal, 3),
    redondear(objComb.aprov, 2) + "%",
    "$ " + redondear(objComb.price, 2),
  ];
};

const cargarBarrasTabla = (arrayOfRows) => {
  // No reset content here, otherwise the first table will not show
  // outputTablaContainer.innerHTML= ''
  const rowHead = createRow(
    [
      "Combinación",
      "Área Total",
      "N°Total Barras",
      "% Aprovechamiento",
      "Precio por 1m de barras",
    ],
    "th"
  );
  const newTable = createTable([rowHead, ...arrayOfRows]);
  outputTablaContainer.appendChild(newTable);
};
