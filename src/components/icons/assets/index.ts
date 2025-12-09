import React from "react";
import AHU1 from "./ahu1";
import AHU2 from "./ahu2";
import AirAdmittanceValve from "./airAdmittanceValve";
import AirCompressor from "./airCompressor";
import BackflowPreventer from "./backflowPreventer";
import Battery from "./battery";
import BatteryInverter from "./batteryInverter";
import Cabinet from "./cabinet";
import CableTray from "./cableTray";
import CarbonDioxideSensor from "./carbonDioxideSensor";
import CarbonMonoxideDetector from "./carbonMonoxideDetector";
import CardReader from "./cardReader";
import CeilingTiles from "./ceilingTiles";
import ChillerAirCooled from "./chillerAirCooled";
import ChillerWaterCooled from "./chillerWaterCooled";
import Clock from "./clock";
import Computer from "./computer";
import ControlDamper from "./controlDamper";
import CoolingTower from "./coolingTower";
import DataReceptacle from "./dataReceptacle";
import Defibrillator from "./defibrillator";
import Defibrillator2 from "./defibrillator2";
import Dehumidifier from "./dehumidifier";
import DesktopComputer from "./desktopComputer";
import DimmingSwitch from "./dimmingSwitch";
import DisconnectSwitch from "./disconnectSwitch";
import DisconnectSwitch2 from "./disconnectSwitch2";
import Disposal from "./disposal";
import Door from "./door";
import DoorContact from "./doorContact";
import DrinkingFountain from "./drinkingFountain";
import DuctworkSheetmetal from "./duckworkSheetmetal";
import DuctworkInsulation from "./ductworkInsulation";
import Electrical from "./electrical";
import ElectricalPanel from "./electricalPanel";
import Elevator1 from "./elevator1";
import Elevator2 from "./elevator2";
import EOLResistor from "./eolResistor";
import EolResistor2 from "./eolResistor2";
import Escalator from "./escalator";
import ExhaustFan from "./exhaustFan";
import ExpansionTank from "./expansionTank";
import EyeWash from "./eyeWash";
import FanCoilUnit from "./fanCoilUnit";
import Faucet from "./faucet";
import Fence from "./fence";
import FireAlarm from "./fireAlarm";
import FireAlarmCommunicator from "./fireAlarmCommunicator";
import FireExtinguisher1 from "./fireExtinguisher1";
import FireExtinguisher2 from "./fireExtinguisher2";
import FireJBox from "./fireJBox";
import FireSafety from "./fireSafety";
import FloorDrain from "./floorDrain";
import FloorSink from "./floorSink";
import Fuse from "./fuse";
import GasMeter from "./gasMeter";
import Generator from "./generator";
import GreaseTrap from "./greaseTrap";
import GroundingCabinet from "./groundingCabinet";
import Gutter from "./gutter";
import HeaderBaseboard from "./heaterBaseboard";
import HeaterElectric from "./heaterElectric";
import HeaterInfrared from "./heaterInfrared";
import HoseBibb from "./hoseBibb";
import HubDrain from "./hubDrain";
import Humidifier from "./humidifier";
import HumiditySensor from "./humiditySensor";
import HVAC from "./hvac";
import InitiatingDevice1 from "./initiatingDevice1";
import InitiatingDevice2 from "./initiatingDevice2";
import IrrigationSystem from "./irrigationSystem";
import IrrigationZoneValves from "./irrigationZoneValves";
import JBox from "./jBox";
import JBox2 from "./jBox2";
import KitchenHood from "./kitchenHood";
import Landscape from "./landscape";
import Laptop from "./laptop";
import LCDAnnunciator from "./lcdAnnunciator";
import LightEmergency1 from "./lightEmergency1";
import LightEmergency2 from "./lightEmergency2";
import LightExit from "./lightExit";
import LightFixture from "./lightFixture";
import LightFluorescent from "./lightFluorescent";
import LightLed from "./lightLed";
import LightSwitch from "./lightSwitch";
import MainDistributionPanel from "./mainDistributionPanel";
import Mechanical from "./mechanical";
import Meter from "./meter";
import MopSink from "./mopSink";
import MotionDetector from "./motionDetector";
import Motor from "./motor";
import MowerLawn from "./mowerLawn";
import MowerRiding from "./mowerRiding";
import Mri1 from "./mri1";
import NotificationAppliance1 from "./notificationAppliance1";
import NotificationAppliance2 from "./notificationAppliance2";
import OccupancySensor from "./occupancySensor";
import Other1 from "./other1";
import Other2 from "./other2";
import ParkingLight from "./parkingLight";
import PhotoSensor from "./photoSensor";
import PipeHanger from "./pipeHanger";
import Plug from "./plug";
import Plumbing from "./plumbing";
import PortableGenerator from "./portableGenerator";
import Printer from "./printer";
import Projector from "./projector";
import Pumps from "./pumps";
import RefrigerantCopperPiping from "./refrigerantCopperPiping";
import Register from "./register";
import RooftopUnit from "./rooftopUnit";
import Room from "./room";
import Security from "./security";
import SecurityCamera from "./securityCamera";
import SecurityControlPanel from "./securityControlPanel";
import ServerRack from "./serverRack";
import ShowerTub from "./showerTub";
import Sink from "./sink";
import SmartPhone from "./smartPhone";
import SolarPanel from "./solarPanel";
import SolarPanelBackupBaattery from "./solarPanelBackupBaattery";
import SolarPanelInverter from "./solarPanelInverter";
import SplitDxUnit from "./splitDxUnit";
import Sprinkler from "./sprinkler";
import SubMeter from "./subMeter";
import Tablet from "./tablet";
import TemperatureSensor from "./temperatureSensor";
import Thermostat from "./thermostat";
import ThermostaticMixingValve from "./thermostaticMixingValve";
import Toilet from "./toilet";
import TransferSwitch from "./transferSwitch";
import Transformer1 from "./transformer1";
import Transformer2 from "./transformer2";
import Transformer3 from "./transformer3";
import TransmissionTower from "./transmissionTower";
import Transponder from "./transponder";
import Urinal from "./urinal";
import Valve from "./valve";
import VAVBox from "./vavBox";
import VrfIndoorUnit from "./vrfIndoorUnit";
import VrfOutdoorHeatPump from "./vrfOutdoorHeatPump";
import WallHydrant from "./wallHydrant";
import WaterBoiler from "./waterBoiler";
import WaterFlowStation from "./waterFlowStation";
import WaterHeater from "./waterHeater";
import WaterMeter from "./waterMeter";
import WaterSourceHeatPump from "./waterSourceHeatPump";
import Window from "./window";
import WirelessRouter from "./wirelessRouter";
import WiringElectrical from "./wiringElectrical";
import WiringLowVoltage from "./wiringLowVoltage";
import Xray1 from "./xray1";
import Xray2 from "./xray2";

interface AssetIconProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const AssetIcons: { [key: string]: React.FC<AssetIconProps> } = {
  AHU1,
  AHU2,
  AirAdmittanceValve,
  AirCompressor,
  BackflowPreventer,
  Battery,
  BatteryInverter,
  Cabinet,
  CableTray,
  CarbonDioxideSensor,
  CarbonMonoxideDetector,
  CardReader,
  CeilingTiles,
  ChillerAirCooled,
  ChillerWaterCooled,
  Clock,
  Computer,
  ControlDamper,
  CoolingTower,
  DataReceptacle,
  Defibrillator,
  Defibrillator2,
  Dehumidifier,
  DesktopComputer,
  DimmingSwitch,
  DisconnectSwitch,
  DisconnectSwitch2,
  Disposal,
  Door,
  DoorContact,
  DrinkingFountain,
  DuctworkInsulation,
  DuctworkSheetmetal,
  EOLResistor,
  EolResistor2,
  Electrical,
  ElectricalPanel,
  Elevator1,
  Elevator2,
  Escalator,
  ExhaustFan,
  ExpansionTank,
  EyeWash,
  FanCoilUnit,
  Faucet,
  Fence,
  FireAlarm,
  FireAlarmCommunicator,
  FireExtinguisher1,
  FireExtinguisher2,
  FireJBox,
  FireSafety,
  FloorDrain,
  FloorSink,
  Fuse,
  GasMeter,
  Generator,
  GreaseTrap,
  GroundingCabinet,
  Gutter,
  HVAC,
  HeaderBaseboard,
  HeaterElectric,
  HeaterInfrared,
  HoseBibb,
  HubDrain,
  Humidifier,
  HumiditySensor,
  InitiatingDevice1,
  InitiatingDevice2,
  IrrigationSystem,
  IrrigationZoneValves,
  JBox,
  JBox2,
  KitchenHood,
  LCDAnnunciator,
  Landscape,
  Laptop,
  LightEmergency1,
  LightEmergency2,
  LightExit,
  LightFixture,
  LightFluorescent,
  LightLed,
  LightSwitch,
  MainDistributionPanel,
  Mechanical,
  Meter,
  MopSink,
  MotionDetector,
  Motor,
  MowerLawn,
  MowerRiding,
  Mri1,
  NotificationAppliance1,
  NotificationAppliance2,
  OccupancySensor,
  Other1,
  Other2,
  ParkingLight,
  PhotoSensor,
  PipeHanger,
  Plug,
  Plumbing,
  PortableGenerator,
  Printer,
  Projector,
  Pumps,
  RefrigerantCopperPiping,
  Register,
  RooftopUnit,
  Room,
  Security,
  SecurityCamera,
  SecurityControlPanel,
  ServerRack,
  ShowerTub,
  Sink,
  SmartPhone,
  SolarPanel,
  SolarPanelBackupBaattery,
  SolarPanelInverter,
  SplitDxUnit,
  Sprinkler,
  SubMeter,
  Tablet,
  TemperatureSensor,
  Thermostat,
  ThermostaticMixingValve,
  Toilet,
  TransferSwitch,
  Transformer1,
  Transformer2,
  Transformer3,
  TransmissionTower,
  Transponder,
  Urinal,
  VAVBox,
  Valve,
  VrfIndoorUnit,
  VrfOutdoorHeatPump,
  WallHydrant,
  WaterBoiler,
  WaterFlowStation,
  WaterHeater,
  WaterMeter,
  WaterSourceHeatPump,
  Window,
  WirelessRouter,
  WiringElectrical,
  WiringLowVoltage,
  Xray1,
  Xray2,
};

export default AssetIcons;
