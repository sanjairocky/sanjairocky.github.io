window.servers=["","http://localhost:8081","http://192.168.0.111:8081"],window.serviceUrl=window.servers[0],Promise.all(window.servers.map((e=>fetch(`${e}/api/health`).then((e=>e.url))))).then((e=>{window.serviceUrl=e[0].split("/api/health")[0]}));