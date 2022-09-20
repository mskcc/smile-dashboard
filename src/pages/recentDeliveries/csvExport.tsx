
import {buildRequestTableColumns, StaticTableColumns} from "./helpers";
import jsdownload from "js-file-download";

   export function CSVGenerate(requests) {

        const csvString=[

          StaticTableColumns.map(item => item.label),
            requests.map(req => 
              StaticTableColumns.map(col => 
                 req[col.dataKey!]
                )
            
            )

        ]

        .map(e => e.join("\t")) 
        .join("\n");

        console.log(csvString)

        jsdownload(csvString,"report.csv");
        

      //   const csvString = [

          
      //   [  "IGO Request ID",
      //   "IGO Project ID",
      //   "Project Manager Name",
      //   "Investigator Name",
      //   "Investigator Email",
      //   "Data Analyst Name",
      //   "Data Analyst Email",
      //   "Gene Panel"

      // ],

      // {}
      //   ...y.map(item => [
      //     item.igoRequestId,
      //     item.igoProjectId,
      //     item.projectManagerName,
      //     item.investigatorName,
      //     item.investigatorEmail,
      //     item.dataAnalystName,
      //     item.dataAnalystEmail,
      //     item.genePanel

      //   ]
          
      //     )

      //   ]

        // .map(e => e.join(",")) 
        // .join("\n");


        // 

       }