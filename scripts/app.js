const tablaKD = {
    H20: [1.218,
        .890,
        .749,
        .668,
        .615,
        .577,
        .548,
        .525,
        .507,
        .492,
        .479,
        .469
        ],
    H25: [1.089,
        .796,
        .670,
        .598,
        .550,
        .516,
        .490,
        .470,
        .453,
        .440,
        .429,
        .419,],
    H30: {},
    ke: [24.301,
        24.766,
        25.207,
        26.625,
        26.021,
        26.399,
        26.758,
        27.100,
        27.427,
        27.739,
        28.038,
        28.324],
    Ec: [3,
        3,
        3,
        3,
        3,
        3,
        3,
        3,
        3,
        3,
        3,
        3,
    ],
    Et: [60,
        30,
        20,
        15,
        12,
        10,
        8.57,
        7.50,
        6.67,
        6,
        5.45,
        5],
    kc: [.048,
        .091,
        .130,
        .167,
        .200,
        .231,
        .259,
        .286,
        .310,
        .333,
        .355,
        .375,],
    kz: [.980,
        .961,
        .945,
        .929,
        .915,
        .902,
        .890,
        .879,
        .868,
        .858,
        .849,
        .841],
}

const linearInterpolation = (index1, index2, key, H, kdCalc) => {
    let kd1 = tablaKD[H][index1]
    let kd2 = tablaKD[H][index2]
    let k1 = tablaKD[key][index1]
    let k2 = tablaKD[key][index2]

    const keC = k2 + ((k1-k2)*(kd2-kdCalc)/(kd2-kd1))
    console.log('Valor de interpolacion - ',key, keC)
    return keC;
}

const obtenerKeDeTabla = (kdCalc, H, tabla) => {
    for (value of tabla[H]) {
        // Buscamos el inmediato inferior
        if (kdCalc >= value) {
            // Obtenemos el index del inmediato inferior como 1 y el superior como 2
            let index1 = tabla[H].indexOf(value)
            let index2 = tabla[H].indexOf(value)-1
            const output = {
                ke: linearInterpolation(index1, index2, 'ke', H, kdCalc),
                Ec: linearInterpolation(index1, index2, 'Ec', H, kdCalc),
                Et: linearInterpolation(index1, index2, 'Et', H, kdCalc),
                kc: linearInterpolation(index1, index2, 'kc', H, kdCalc),
                kz: linearInterpolation(index1, index2, 'kz', H, kdCalc),
            }
            cargarResultadosTabla(output)
            return  output;
            // cargarResultadosTabla(output)
            // return;
        }
    }
}
const calcArea = diam => Math.PI * (diam/10)**2/4;
const calcCantbarras = (Abarra, AsNec) => Math.ceil(AsNec/Abarra)
// Se espera que las unidades sean (cm, cm,kN, KNcm, 'H25', cm)
const calculoViga = (vars) => {
    const {anchoB, altoH, Nu, Mu, H, rec} = vars
    const b = anchoB;
    const h = altoH;
    const facSeg = 0.90;
    const Nn = Nu/1000/facSeg;
    const Mn = Mu/100000/facSeg;
    const d = h - rec;
    const ye = h/2 - rec;
    const Men = Mn - Nn*(ye/100)
    const kdCalc = (d/100)/(Math.sqrt(Men/(b/100)))
    console.log(b, h,'Valores de calculo',Nn, Mn, d, ye, 'Men',Men, 'kdCalc',kdCalc)
    const obj = obtenerKeDeTabla(kdCalc, H, tablaKD)
    // Calculo de armadura necesaria
    const AsNec = obj.ke*(Men/(d/100))+(Nn*10000/420)
    console.log('Armadura necesaria: ', AsNec, 'cm2')
}

// Se podria crear una funcion para determinar la cantidad de barras minimas recomendables en funcion de las dimensiones de la viga. Con esto, podemos trabajar usando primero solo 2 diametro contiguos para determinar varias combinaciones. Posteriormente en caso de vigas con dimensiones muy grandes podemos mezclar 3 diametros y ampliar la solucion.

// calcArmadura(7.24)
// combinacionBarras(7.24)
const combBarrasIguales = (AsNec) => {
    const resultado = []
    const diamDisp = [6,8,10,12,16,20,25];
    for (let i=1; i<diamDisp.length; i++) {
        let area = 0;
        let numB = 2;
        let aprov;
        // Usando barras iguales
        while (area < AsNec) {
            area = calcArea(diamDisp[i])*numB;
            aprov = (AsNec*100/area)
            if (area >= AsNec) {
            // console.log('La armadura que verifica es ',i, diamDisp[i], aprov);
            resultado.push({numDiam1: 0,
                            diam1: 0, 
                            numDiam2: numB,
                            diam2: diamDisp[i],
                            aprov: aprov, 
                            areaTot: area,
                            numBarrTotal: numB,
                            });
                continue;
            }
            numB++
        }       
    }
    return resultado
}
const combBarrasDist = (AsNec) => {
    const resultado = []
    const diamDisp = [6,8,10,12,16,20,25];
    for (let i=1; i<diamDisp.length; i++) {
        let area = 0;
        let numB = 2;
        let numB2 = 1
        let aprov;
        // Usando barras distintas
        while (area < AsNec) {
            area = calcArea(diamDisp[i])*numB;
            if (area >= AsNec) {
            // console.log('La armadura que verifica es ',i, diamDisp[i], aprov);
                aprov = (AsNec*100/area)
                resultado.push({numDiam1: 0,
                                diam1: 0, 
                                numDiam2: numB,
                                diam2: diamDisp[i],
                                aprov: aprov, 
                                areaTot: area,
                                numBarrTotal: numB + numB2,
                                });
                                continue;
            }
            numB2 = calcCantbarras(calcArea(diamDisp[i-1]),AsNec-area)
            area = area + numB2*calcArea(diamDisp[i-1])
            aprov = (AsNec*100/area)
            if (area >= AsNec) {
            // console.log('La armadura que verifica es ',i, diamDisp[i], aprov);
            resultado.push({numDiam1: numB2,
                            diam1: diamDisp[i-1], 
                            numDiam2: numB,
                            diam2: diamDisp[i],
                            aprov: aprov, 
                            areaTot: area,
                            numBarrTotal: numB + numB2,
                            });
            }
            numB++
        }       
    }
    return resultado
}

const barrasTotales = (aNec, maxCantBarras) => {
    const resultado = [...combBarrasDist(aNec), ...combBarrasIguales(aNec)];
    resultado.sort((a,b) => b.aprov-a.aprov)
    resultado.sort((a,b) => a.numBarrTotal-b.numBarrTotal)
    console.log(resultado.filter((comb) => comb.numDiam1+comb.numDiam2 <= maxCantBarras && comb.aprov >= 80))
}

barrasTotales(9.5,50)

// Interaccion con el DOM, obtengo elementos
const inputAnchoB = document.getElementById('anchoB')
const inputAltoH = document.getElementById('altoH')
const inputRec = document.getElementById('rec')
const inputNu = document.getElementById('Nu')
const inputMu = document.getElementById('Mu')
const inputH = document.getElementById('calidadH')
const btnCalc = document.getElementById('btnCalcular')

const outputTabla = document.getElementById('tablaResultados')
const outputTablaContainer = document.getElementById('tablaContainer')

const output = document.getElementById('resultado1')

// Defino variables iniciales en un objeto
let vars = {
    anchoB: 20,
    altoH: 50,
    Nu: 100,
    Mu: 10000,
    H: 'H20',
    rec: 3.5,
}

// Leo los valores de los inputs y los guardo en un objeto con todas las variables

inputAnchoB.onchange = function(e) {
    vars.anchoB = e.target.value;
    output.innerHTML = vars.anchoB
};
inputAltoH.onchange = function(e) {
    vars.altoH = e.target.value;
    output.innerHTML = vars.altoH
};
inputRec.onchange = function(e) {
    vars.rec = e.target.value;
    output.innerHTML = vars.rec
};
inputNu.onchange = function(e) {
    vars.Nu = e.target.value;
    output.innerHTML = vars.Nu
};
inputMu.onchange = function(e) {
    vars.Mu = e.target.value;
    output.innerHTML = vars.Mu
};
inputH.onchange = function(e) {
    vars.H = e.target.value;
    output.innerHTML = vars.H
};

btnCalc.onclick = () => calculoViga(vars)

// Mostrar resultados
// ke
// Ec
// Et
// kc
// kz

const createRow = (array,type = 'td') => {
    let newRow = document.createElement('tr')
    let newTD = document.createElement(type)
    for (const value of array) {
        let node = document.createTextNode(value);
        let newTH = document.createElement(type)
        newTH.appendChild(node);
        newRow.appendChild(newTH);
    }
    return newRow
    // console.log(newRow)
}

const createTable = (arrayOfRows) => {
    const newTable = document.createElement('table')
    const newTHead = document.createElement('thead')
    const newTBody = document.createElement('tbody')
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

}

const cargarResultadosTabla = (obj) => {
    const {ke, Ec, Et, kc, kz} = obj;
    const rowHead = createRow(['Nombre', 'Valor', 'Unidad'],'th');
    const keRow = createRow(['ke', ke, ''])
    const EcRow = createRow(['Ec', Ec, ''])
    const EtRow = createRow(['Et', Et, ''])
    const kcRow = createRow(['kc', kc, ''])
    const kzRow = createRow(['kz', kz, ''])

    const newTable = createTable([rowHead, keRow, EcRow, EtRow, kcRow, kzRow])
    outputTablaContainer.appendChild(newTable)
}