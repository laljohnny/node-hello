import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Box, SimpleGrid } from "@chakra-ui/react";
import GreetingBar from "../../components/GreetingBar";
import CrisisCheck from "../../components/CrisisCheck";
import WorkOrders from "./WorkOrders";
import AssetPerformance from "../../components/AssetPerformance";
import { bffApi } from "../../components/api";
import { useAuth } from "../../context/AuthContext";
import ExecutiveDashboard from "./ExecutiveDashboard";

const initialRows = [
  [
    { id: "critical_alerts", type: "critical_alerts" },
    { id: "work_orders", type: "work_orders" },
  ],
  [{ id: "asset_performance", type: "asset_performance" }],
];

const Dashboard = () => {
  const [rows, setRows] = useState(initialRows);
  const [dashboardData, setDashboardData] = useState<any>();
const { user } = useAuth();
  // 🔹 Drag handler
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const newRows = [...rows];

    if (source.droppableId === destination.droppableId) {
      // same row reorder
      const rowIndex = parseInt(source.droppableId);
      const row = Array.from(newRows[rowIndex]);
      const [moved] = row.splice(source.index, 1);
      row.splice(destination.index, 0, moved);
      newRows[rowIndex] = row;
    } else {
      // move between rows
      const sourceRowIndex = parseInt(source.droppableId);
      const destRowIndex = parseInt(destination.droppableId);
      const sourceRow = Array.from(newRows[sourceRowIndex]);
      const destRow = Array.from(newRows[destRowIndex]);
      const [moved] = sourceRow.splice(source.index, 1);
      destRow.splice(destination.index, 0, moved);
      newRows[sourceRowIndex] = sourceRow;
      newRows[destRowIndex] = destRow;
    }
    setRows(newRows);
  };

  // 🔹 Card rendering
  const getCardComponent = (type: string) => {
    switch (type) {
      case "critical_alerts":
        return dashboardData?.panel_1_critical_alerts ? (
          <CrisisCheck panel={dashboardData.panel_1_critical_alerts} />
        ) : null;
      case "work_orders":
        return dashboardData?.panel_2_work_orders ? (
          <WorkOrders panel={dashboardData.panel_2_work_orders} />
        ) : null;
      case "asset_performance":
        return dashboardData?.panel_3_asset_performance ? (
          <AssetPerformance panel={dashboardData.panel_3_asset_performance} />
        ) : null;
      default:
        return null;
    }
  };

  const getItemStyle = (isDragging: boolean, draggableStyle: any) => ({
    userSelect: "none",
    ...draggableStyle,
  });

  // 🔹 Load API data
  useEffect(() => {
    (async () => {
      try {
        const res = await bffApi.get("property_manager_json_payloads.json");
        setDashboardData(res?.data?.property_manager_dashboard);
      } catch (error: any) {
        console.log(error.message);
      }
    })();
  }, []);

  return (
    <Box>
      <Box mb={6}>
        <GreetingBar
          name="Sarah"
          buildingInfo="Metro Plaza Complex . 3 Buildings . 450,000 sq ft"
          weather="42°F, Clear"
        />
      </Box>

      {user?.properties?.roles[0]?.displayname == 'propertymanager' ? 
      <>
      <DragDropContext onDragEnd={onDragEnd}>
        {rows.map((rowItems, rowIndex) => (
          <Droppable
            key={rowIndex}
            droppableId={rowIndex.toString()}
            direction="horizontal"
          >
            {(provided: any) => (
              <SimpleGrid
                ref={provided.innerRef}
                {...provided.droppableProps}
                columns={rowItems.length}
                gap={5}
                mb={5}
                alignItems="stretch"
              >
                {rowItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided: any, snapshot: any) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style
                        )}
                        h="100%"
                      >
                        {getCardComponent(item.type)}
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </SimpleGrid>
            )}
          </Droppable>
        ))}
      </DragDropContext>
      </> :( 
      <>
        <ExecutiveDashboard />
      </>
    )}
 
      
    </Box>
  );
};

export default Dashboard;
