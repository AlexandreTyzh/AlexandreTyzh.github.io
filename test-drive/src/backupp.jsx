import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [columnMap, setColumnMap] = useState(new Map());
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchSheetData();
  }, []);

  const processData = (data) => {
    const newMap = new Map();
    const adjMap = new Map();
    const headers = data[0] || [];
    headers.forEach((header, columnIndex) => {
      if(columnIndex==1||columnIndex==2||columnIndex==3||columnIndex==4||columnIndex==5||columnIndex==6||columnIndex==7||columnIndex==8||columnIndex==10||columnIndex==15){
        const uniqueValues = [...new Set(
          data.slice(1).map(row => row[columnIndex])
        )];
        adjMap.set(header, uniqueValues);
      }
      }
    );
    newMap.set("Marca", []);
    newMap.set("Série", []);
    newMap.set("Formato", []);
    newMap.set("Descrição", []);
    newMap.set("Grupo Preço", []);
    newMap.set("Preço", []);
    newMap.set("UM Preço", []);
    newMap.set("m2_Caixa", []);




    newMap.set("Codice EAN/UPC", []);
    newMap.set("Moeda", []);
    adjMap.forEach((value, key) => {
      if (key === "Moeda") {
        if(value=="EUR"){
          let updatedValues = newMap.get("Preço").map(val => val +" €");
          newMap.set("Preço", updatedValues);
        } else {
          let updatedValues = newMap.get("Preço").map(val => val +" "+ newMap.get("Moeda"));
          newMap.set("Preço", updatedValues);
        }
      } else {
        newMap.set(key, value);
      }
      newMap.delete("Moeda");
    });
    setColumnMap(newMap);
  };

  const fetchSheetData = async () => {
    try {
      const response = await fetch('http://localhost:8080/');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      const sheetData = result.values || [];
      setData(sheetData);
      processData(sheetData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const clearFilters = () => {
    loading
    setFilters({});
  };

  const handleSelectChange = (header, value) => {
    setFilters(prev => ({
      ...prev,
      [header]: value
    }));
    
  };
  const convertColumnMapToMatrix = (columnMap) => {
    const matrix = [];
    columnMap.forEach((values, header) => {
      matrix.push([header, ...values]);
    });
  
    return matrix;
  };

  const getFilteredOptionsForColumn = (header) => {
    const matrix = convertColumnMapToMatrix(columnMap);
    const headers = matrix.map(row => row[0]); // Extrai os cabeçalhos da primeira coluna da matriz
  const columnIndex = headers.indexOf(header); // Encontra o índice da coluna do header
  
  if (columnIndex === -1) {
    return []; // Retorna um array vazio se o header não for encontrado
  }

  // Filtramos as linhas com base nos filtros aplicados
  const filteredRows = matrix.filter((row, rowIndex) => {
    if (rowIndex === 0) return false; // Pula a linha de cabeçalhos
    
    // Verifica cada filtro aplicado
    return Object.entries(filters).every(([filterHeader, filterValue]) => {
      if (filterHeader === header || !filterValue) return true;
      const filterColumnIndex = headers.indexOf(filterHeader); // Índice da coluna do filtro
      return row[filterColumnIndex] === filterValue;
    });
  });

  // Mapeia os valores únicos da coluna filtrada
  return [...new Set(filteredRows.map(row => row[columnIndex]))].sort((a, b) => {
    const numA = Number(String(a).replace(/[^\d.-]/g, ''));
    const numB = Number(String(b).replace(/[^\d.-]/g, ''));
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    return String(a).localeCompare(String(b));
  });
};

  return (
    <>
      <div className="painel">
        <h1>Painel</h1>
        
        {loading && <p>Carregando dados...</p>}
        {error && <p>Erro: {error}</p>}
        
        {!loading && !error && (
          <div className='container'>
            {Array.from(columnMap).map(([header], headerIndex) => (
              <div key={header}>
                <label>{header}</label><br />
                  <select 
                    className="select-options"
                    onChange={(e) => handleSelectChange(header, e.target.value)}
                    value={filters[header] || ""}
                  >
                    <option value="">{header}</option>
                    {getFilteredOptionsForColumn(header).map((value, index) => (
                      <option key={index} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
              </div>
            ))}
            <div className='clear-button'>
              <button onClick={clearFilters}>Limpar Opções</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App