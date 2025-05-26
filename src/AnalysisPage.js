body {
    font-family: sans-serif;
    margin: 0;
    padding: 0;
  }
  
  .header-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 70px;
    background-color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #ccc;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
  
  .analysis-container {
    background-color: #F0F4FF;
    min-height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    padding-top: 80px;
    overflow-y: auto;
  }
  
  .analysis-content {
    width: 90%;
    max-width: 1200px;
    margin-top: 0;
  }
  
  .analysis-content h2 {
    margin-top: 0;
    padding-top: 10px;
    text-align: center;
  }
  
  .dashboard-container {
    background-color: white;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: row;
    align-items: center;
    width: auto;
    margin-top: 0;
  }
  
  .dashboard {
    display: flex;
    align-items: center;
    padding-left: 30px;
    padding-right: 30px;
    gap: 20px;
    width: auto;
    margin-bottom: 10px;
  }
  
  .category-charts-container {
    width: auto;
    overflow-x: auto;
    padding-top: 10px;
  }
  
  .category-charts {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
    padding: 5px;
  }
  
  .category-chart {
    background-color: white;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
    min-width: 250px;
  }
  
  .download-container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
    }
    
    .download-button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    text-decoration: none;
    font-size: 16px;
    border-radius: 5px;
    cursor: pointer;
    margin-bottom: 10px;
    border: none;
    }
    
    .download-button:hover {
    background-color: #45a049;
    }
  
  
  .analysis-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    border-radius: 5px;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .analysis-table th, .analysis-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    border-radius: 5px;
  }
  
  .analysis-table th {
    background-color: #f4f4f4;
    font-weight: bold;
    border-radius: 5px;
  }
  
  .analysis-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }