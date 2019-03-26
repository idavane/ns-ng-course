import { Component, NgZone } from "@angular/core";
import { alert } from "tns-core-modules/ui/dialogs";
import { AggregateBy, HealthData, HealthDataType } from "nativescript-health-data";

import { getLocaleDateFormat } from "@angular/common";

@Component({
    selector: 'ns-schrittzaehler',
    templateUrl: './schrittzaehler.component.html',
    styleUrls: ['./schrittzaehler.component.css'],
    moduleId: module.id
})
export class SchrittzaehlerComponent {
    private static TYPES: Array<HealthDataType> = [
        {name: "height", accessType: "read"},
        {name: "weight", accessType: "readAndWrite"}, // just for show but read only
        {name: "steps", accessType: "read"},
        {name: "distance", accessType: "read"},
        {name: "heartRate", accessType: "read"},
        {name: "fatPercentage", accessType: "read"}
      ];
    
      private healthData: HealthData;
      resultToShow = "";

    
      constructor(private zone: NgZone) {
       
        this.healthData = new HealthData();
      }

      /*private round(value: number, decimals: number) {
        var strnumber = `${value}e${decimals}`;
        var numround = Math.round(Number(strnumber));
        var strfinal = `${numround}e-${decimals}`;
        return Number(strfinal);
      }*/

      private formatDate(value: Date) {
        return value.toLocaleDateString("en-us") + " " + value.toLocaleTimeString("en-us");
      }
      
      isAvailable(): void {
        this.healthData.isAvailable(true)
            .then(available => this.resultToShow = available ? "Health Data available :)" : "Health Data not available :(");
      }
    
      isAuthorized(): void {
        this.healthData.isAuthorized([<HealthDataType>{name: "steps", accessType: "read"}])
            .then(authorized => setTimeout(() => alert({
              title: "Authentication result",
              message: (authorized ? "" : "Not ") + "authorized for " + JSON.stringify(SchrittzaehlerComponent.TYPES),
              okButtonText: "Ok!"
            }), 300));
      }
    
      requestAuthForVariousTypes(): void {
        this.healthData.requestAuthorization(SchrittzaehlerComponent.TYPES)
            .then(authorized => setTimeout(() => alert({
              title: "Authentication result",
              message: (authorized ? "" : "Not ") + "authorized for " + JSON.stringify(SchrittzaehlerComponent.TYPES),
              okButtonText: "Ok!"
            }), 300))
            .catch(error => console.log("Request auth error: ", error));
      }
    
     /* getAllData():void {
        Object.keys(this.healthData).forEach(function(key) {
                  
          console.log('Key : ' + key + ', Value : ' + this.healthData[key])
        })
      }*/
      getData(dataType: string, unit: string, aggregateBy?: AggregateBy): Promise<void> {
        
        return this.healthData.query(
            {
              startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000), // 1 day ago
              endDate: new Date(), // now
              dataType: dataType, // equal to the 'name' property of 'HealthDataType' ("steps,weight etc...")
              unit: unit,  // make sure this is compatible with the 'dataType' (see below) ("count") 
              aggregateBy: aggregateBy,  // optional, one of: "hour", "day", "sourceAndDay" ("day")
              //sortOrder: "desc" // optional, default "asc"
            })
            .then(result => {
             var fitData = "";
                   Object.keys(result[0]).forEach(function(key) {

                  fitData += (key + ' : '  + result[0][key]+ "\n");
                  })
                  
                this.resultToShow = fitData;
            })
            .catch(error => this.resultToShow = error);
      }

     /* private updateStepsUI(result) {
        console.log("schrittzaehler update: " + JSON.stringify(result));
    
        this.set("step_startDate", this.formatDate(result.startDate));
        this.set("step_endDate", this.formatDate(result.endDate));
        this.set("step_steps", result.steps);
        this.set("step_distance", this.round(result.distance, 3) + " meter");
      }*/
    
      startMonitoringData(dataType: string, unit: string): void {
        this.healthData.startMonitoring(
            {
              dataType: dataType,
              enableBackgroundUpdates: true,
              backgroundUpdateFrequency: "immediate",
              onUpdate: (completionHandler: () => void) => {
                console.log("Our app was notified that health data changed, so querying...");
                this.getData(dataType, unit).then(() => completionHandler());
              }
            })
            .then(() => this.resultToShow = `Started monitoring ${dataType}`)
            .catch(error => this.resultToShow = error);
      }
    
      stopMonitoringData(dataType: string): void {
        this.healthData.stopMonitoring(
            {
              dataType: dataType,
            })
            .then(() => this.resultToShow = `Stopped monitoring ${dataType}`)
            .catch(error => this.resultToShow = error);
      }

}