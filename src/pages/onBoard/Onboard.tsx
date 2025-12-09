import { ReactNode, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import RightSideModal from "../../components/RightSideModal";
import LocationModal from "../../components/ModalContent/LocationModal";
import FloorModal from "../../components/ModalContent/FloorModal";
import ZoneModal from "../../components/ModalContent/ZoneModal";
import RoomModal from "../../components/ModalContent/RoomModal";
import AssetModal from "../../components/ModalContent/AssetModal";
import { api } from "../../components/api";
import { onboardData } from "./onboardData";

type HierarchyLevel = "location" | "floor" | "zone" | "room";
type NodeType = HierarchyLevel | "asset";

type AssetContext =
	| {
		parentId: string;
			parentType: HierarchyLevel;
	  }
	| null;

type TreeNode = {
	nodeId: string;
	id: string;
	type: NodeType;
	name: string;
	data: any;
	children: TreeNode[];
	parentChain: string[];
};

type DetailField = {
	key: string;
	label: string;
	multiline?: boolean;
	placeholder?: string;
};

const LEVEL_LABELS: Record<NodeType, string> = {
	location: "Location",
	floor: "Floor",
	zone: "Zone",
	room: "Room",
	asset: "Asset",
};

const LEVEL_STYLES: Record<NodeType, { icon: string; color: string }> = {
	location: { icon: "./images/location.svg", color: "#174899" },
	floor: { icon: "./images/floor.svg", color: "#D38400" },
	zone: { icon: "./images/zone.svg", color: "#009D6E" },
	room: { icon: "./images/room.svg", color: "#842BF6" },
	asset: { icon: "./images/asset.svg", color: "#1199D0" },
};

const DETAIL_FIELDS: Record<NodeType, DetailField[]> = {
	location: [
		{ key: "name", label: "Name" },
		{ key: "description", label: "Description" },
		{ key: "location_type", label: "Type" },
		{ key: "address.address1", label: "Address 1" },
		{ key: "address.address2", label: "Address 2" },
		{ key: "address.city", label: "City" },
		{ key: "address.state", label: "State" },
		{ key: "address.zip", label: "Zip" },
		{ key: "address.countryalpha2", label: "Country (Alpha-2)" },
		{ key: "tags", label: "Tags" },
	],
	floor: [
		{ key: "name", label: "Name" },
		{ key: "description", label: "Description" },
		{ key: "floorplan", label: "Floor plan" },
		{ key: "type", label: "Type" },
		{ key: "tags", label: "Tags" },
	],
	zone: [
		{ key: "name", label: "Name" },
		{ key: "description", label: "Description" },
		{ key: "tags", label: "Tags" },
	],
	room: [
		{ key: "name", label: "Name" },
		{ key: "description", label: "Description" },
		{ key: "tags", label: "Tags" },
	],
	asset: [
		{ key: "name", label: "Name" },
		{ key: "description", label: "Description" },
		{ key: "assettypeid", label: "Asset Type" },
		{ key: "maintenancestatus", label: "Maintenance Status" },
		{ key: "tags", label: "Tags" },
	],
};

const CHILD_KEY: Record<HierarchyLevel, keyof any> = {
	location: "ca_floor",
	floor: "ca_zone",
	zone: "ca_room",
	room: "ca_asset",
};

const createNodeId = (type: NodeType, id?: string | null) =>
	`${type}:${id ?? Math.random().toString(36).slice(2)}`;

const normalizeToArray = <T,>(value: T | T[] | null | undefined): T[] => {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};

const extractTags = (tags: any): string => {
	if (!tags) return "";
	if (Array.isArray(tags)) {
		return tags
			.map((tag) => {
				if (!tag) return "";
				if (typeof tag === "string") return tag;
				return tag.name ?? "";
			})
			.filter(Boolean)
			.join(", ");
	}
	if (typeof tags === "string") return tags;
	return "";
};

const buildTreeNodes = (locations: any[]): { roots: TreeNode[]; nodeMap: Map<string, TreeNode> } => {
	const nodeMap = new Map<string, TreeNode>();

	const buildHierarchyNode = (
		entity: any,
		type: HierarchyLevel,
		parentChain: string[]
	): TreeNode => {
		const nodeId = createNodeId(type, entity.id);
		const childParentChain = [...parentChain, nodeId];

		const children: TreeNode[] = [];

		// Assets at this level
		if (entity.ca_asset) {
			normalizeToArray(entity.ca_asset).forEach((asset: any) => {
				const assetNode: TreeNode = {
					nodeId: createNodeId("asset", asset.id),
					id: asset.id ?? "",
					type: "asset",
					name: asset.name || "Unnamed Asset",
					data: asset,
					children: [],
					parentChain: childParentChain,
				};
				children.push(assetNode);
				nodeMap.set(assetNode.nodeId, assetNode);
			});
		}

		// Child hierarchy
		if (type !== "room") {
			const childKey = CHILD_KEY[type];
			normalizeToArray(entity[childKey]).forEach((childEntity: any) => {
				const childType =
					type === "location" ? "floor" : type === "floor" ? "zone" : "room";
				const childNode = buildHierarchyNode(childEntity, childType, childParentChain);
				children.push(childNode);
			});
		}

		const node: TreeNode = {
			nodeId,
			id: entity.id ?? "",
			type,
			name: entity.name || "Untitled",
			data: entity,
			children,
			parentChain,
		};
		nodeMap.set(nodeId, node);
		return node;
	};

	const roots = locations.map((location) => buildHierarchyNode(location, "location", []));
	return { roots, nodeMap };
};

const renderLevelIcon = (type: NodeType) => (
	<Box
		component="img"
		src={LEVEL_STYLES[type].icon}
		alt={`${type} icon`}
		sx={{ width: 18, height: 18, mr: 1 }}
	/>
);

const buildDisplayValue = (node: TreeNode, fieldKey: string): string => {
	const segments = fieldKey.split(".");
	let value: any = node.data;
	for (const segment of segments) {
		if (value == null) break;
		value = value[segment];
	}

	if (segments[segments.length - 1] === "tags") {
		return extractTags(node.data.tags);
	}

	if (value == null || value === "") return "-";
	if (Array.isArray(value)) return value.join(", ");
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
};

const deriveAssetContext = (asset: any): AssetContext => {
	if (asset.roomid) return { parentType: "room", parentId: asset.roomid };
	if (asset.zoneid) return { parentType: "zone", parentId: asset.zoneid };
	if (asset.floorid) return { parentType: "floor", parentId: asset.floorid };
	if (asset.locationid) return { parentType: "location", parentId: asset.locationid };
	return null;
};

const Onboard = () => {
	const [locationsData, setLocationsData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const [addLocationModal, setAddLocationModal] = useState(false);
	const [addFloorModal, setAddFloorModal] = useState(false);
	const [addZoneModal, setAddZoneModal] = useState(false);
	const [addRoomModal, setAddRoomModal] = useState(false);
	const [addAssetModal, setAddAssetModal] = useState(false);

	const [locationModalData, setLocationModalData] = useState<any>({});
	const [floorModalData, setFloorModalData] = useState<any>({});
	const [zoneModalData, setZoneModalData] = useState<any>({});
	const [roomModalData, setRoomModalData] = useState<any>({});
	const [assetModalData, setAssetModalData] = useState<any>(null);

	const [assetContext, setAssetContext] = useState<AssetContext>(null);
	const [parentId, setParentId] = useState<string>("");

	const [assetType, setAssetType] = useState<any[]>([]);

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [expandedIds, setExpandedIds] = useState<string[]>([]);
	const [matchedNodeIds, setMatchedNodeIds] = useState<string[]>([]);

	const [confirmationModalShow, setConfirmationModalShow] = useState(false);
	const [selectedDeleteData, setSelectedDeleteData] = useState<any>({});

	const getLocationPlansData = async () => {
		try {
			setLoading(true);
            // const res = await api.patch("data/rest", {
			// 	query: `ca_location{ca_floor{ca_zone{ca_room{ca_asset{}} ca_asset{}} ca_asset{}} ca_asset{}}`,
			// });
			const res = onboardData;
			if (res?.data?.data?.ca_location) {
				const raw = res.data.data.ca_location;
				setLocationsData(Array.isArray(raw) ? raw : [raw]);
			}
		} catch (error) {
			console.error("Fetch error:", error);
		} finally {
			setLoading(false);
		}
	};

	const getAssetType = async () => {
		try {
			const res = await api.patch("data/rest", {
				query: `ca_asset_type{}`,
			});
			if (res?.data?.data?.ca_asset_type) {
				setAssetType(res.data.data.ca_asset_type);
			}
		} catch (error) {
			console.error("Fetch asset type error:", error);
		}
	};

	useEffect(() => {
		getAssetType();
		getLocationPlansData();
	}, []);

	const { roots, nodeMap } = useMemo(() => buildTreeNodes(locationsData), [locationsData]);

	useEffect(() => {
		if (!selectedNodeId && roots.length > 0) {
			setSelectedNodeId(roots[0].nodeId);
		}

		if (selectedNodeId && !nodeMap.has(selectedNodeId)) {
			setSelectedNodeId(roots[0]?.nodeId ?? null);
		}
	}, [roots, nodeMap, selectedNodeId]);

	const selectedNode = useMemo(
		() => (selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null),
		[nodeMap, selectedNodeId]
	);

	useEffect(() => {
		if (!selectedNode) {
			setParentId("");
			return;
		}

		switch (selectedNode.type) {
			case "floor":
				setParentId(selectedNode.data.locationid ?? "");
				break;
			case "zone":
				setParentId(selectedNode.data.floorid ?? "");
				break;
			case "room":
				setParentId(selectedNode.data.zoneid ?? "");
				break;
			default:
				setParentId("");
		}

		setExpandedIds((prev) => {
			const next = new Set(prev);
			selectedNode.parentChain.forEach((id) => next.add(id));
			next.add(selectedNode.nodeId);
			return Array.from(next);
		});
	}, [selectedNode]);

	useEffect(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) {
			setMatchedNodeIds([]);
			return;
		}

		const matches = new Set<string>();
		const expandSet = new Set<string>();

		const traverse = (node: TreeNode): boolean => {
			const name = (node.name || "").toLowerCase();
			let hasMatch = name.includes(term);

			node.children.forEach((child) => {
				if (traverse(child)) {
					expandSet.add(node.nodeId);
					hasMatch = true;
				}
			});

			if (hasMatch) {
				matches.add(node.nodeId);
				node.parentChain.forEach((id) => expandSet.add(id));
			}

			return hasMatch;
		};

		roots.forEach(traverse);

		const matchesArray = Array.from(matches);
		setMatchedNodeIds(matchesArray);
		setExpandedIds((prev) => Array.from(new Set([...prev, ...Array.from(expandSet)])));

		if (
			matchesArray.length > 0 &&
			(!selectedNodeId || !matches.has(selectedNodeId))
		) {
			setSelectedNodeId(matchesArray[0]);
		}
	}, [roots, searchTerm, selectedNodeId]);

	const submitLocationData = async (data: any, isEdit: boolean) => {
		const payload: any = {
			operations: [
				{
					data: {
						ca_location: [
							{
								name: data.name,
								description: data.description,
								location_type: data.type,
								address: {
									address1: data.address1,
									address2: data.address2,
									city: data.city,
									state: data.state,
									zip: data.zip,
									countryalpha2: data.countryalpha2,
								},
							},
						],
					},
				},
			],
		};

			if (isEdit) {
				payload.operations[0].data.ca_location[0].id = data.id;
			}

		try {
			const action = isEdit ? api.put : api.post;
			const res = await action("data/rest", payload);
			if (res?.data) {
				getLocationPlansData();
				setAddLocationModal(false);
				setLocationModalData({});
			}
		} catch (error) {
			console.error("Error submitting location data:", error);
		}
	};

	const submitFloorData = async (data: any, isEdit: boolean) => {
		const payload: any = {
			operations: [
				{
					data: {
						ca_floor: [
							{
								name: data.name,
								description: data.description,
								locationid: parentId,
							},
						],
					},
				},
			],
		};

			if (isEdit) {
				payload.operations[0].data.ca_floor[0].id = data.id;
			}

		try {
			const action = isEdit ? api.put : api.post;
			const res = await action("data/rest", payload);
			if (res?.data) {
				getLocationPlansData();
				setAddFloorModal(false);
				setFloorModalData({});
			}
		} catch (error) {
			console.error("Error submitting floor data:", error);
		}
	};

	const submitZoneData = async (data: any, isEdit: boolean) => {
		const payload: any = {
			operations: [
				{
					data: {
						ca_zone: [
							{
								name: data.name,
								description: data.description,
								floorid: parentId,
							},
						],
					},
				},
			],
		};

			if (isEdit) {
				payload.operations[0].data.ca_zone[0].id = data.id;
			}

		try {
			const action = isEdit ? api.put : api.post;
			const res = await action("data/rest", payload);
			if (res?.data) {
				getLocationPlansData();
				setAddZoneModal(false);
				setZoneModalData({});
			}
		} catch (error) {
			console.error("Error submitting zone data:", error);
		}
	};

	const submitRoomData = async (data: any, isEdit: boolean) => {
		const payload: any = {
			operations: [
				{
					data: {
						ca_room: [
							{
								name: data.name,
								description: data.description,
								zoneid: parentId,
							},
						],
					},
				},
			],
		};

			if (isEdit) {
				payload.operations[0].data.ca_room[0].id = data.id;
			}

		try {
			const action = isEdit ? api.put : api.post;
			const res = await action("data/rest", payload);
			if (res?.data) {
				getLocationPlansData();
				setAddRoomModal(false);
				setRoomModalData({});
			}
		} catch (error) {
			console.error("Error submitting room data:", error);
		}
	};

	const submitAssetData = async (
		data: any,
		isEdit: boolean,
		contextOverride?: AssetContext
	) => {
		const payload: any = {
			operations: [
				{
					data: {
						ca_asset: [
							{
								name: data.name,
								assettypeid: data.assettypeid,
								maintenancestatus: data.maintenancestatus,
							},
						],
					},
				},
			],
		};

		const context = contextOverride ?? assetContext;
		if (context) {
			const foreignKeyMap: Record<HierarchyLevel, string> = {
				location: "locationid",
				floor: "floorid",
				zone: "zoneid",
				room: "roomid",
			};
			payload.operations[0].data.ca_asset[0][foreignKeyMap[context.parentType]] =
				context.parentId;
			}

			if (isEdit) {
				payload.operations[0].data.ca_asset[0].id = data.id;
			}

		try {
			const action = isEdit ? api.put : api.post;
			const res = await action("data/rest", payload);
			if (res?.data) {
				getLocationPlansData();
				setAddAssetModal(false);
				setAssetModalData(null);
			}
		} catch (error) {
			console.error("Error submitting asset data:", error);
		}
	};

	const openEditModalForSelected = () => {
		if (!selectedNode) return;

		switch (selectedNode.type) {
			case "location":
				setLocationModalData(selectedNode.data);
				setAddLocationModal(true);
				break;
			case "floor":
				setFloorModalData(selectedNode.data);
				setParentId(selectedNode.data.locationid ?? "");
				setAddFloorModal(true);
				break;
			case "zone":
				setZoneModalData(selectedNode.data);
				setParentId(selectedNode.data.floorid ?? "");
				setAddZoneModal(true);
				break;
			case "room":
				setRoomModalData(selectedNode.data);
				setParentId(selectedNode.data.zoneid ?? "");
				setAddRoomModal(true);
				break;
			case "asset":
				setAssetModalData(selectedNode.data);
				setAssetContext(deriveAssetContext(selectedNode.data));
				setAddAssetModal(true);
				break;
			default:
				break;
		}
	};

	const handleAddAsset = (entity: any, level: HierarchyLevel) => {
		setAssetContext({ parentId: entity.id, parentType: level });
		setAssetModalData(null);
		setAddAssetModal(true);
	};

	const handleDelete = (data: any, level: NodeType) => {
		setSelectedDeleteData({ ...data, levels: level });
		setConfirmationModalShow(true);
	};

	const deleteLevelsDataConfirmation = async () => {
		setConfirmationModalShow(false);
		const payload: any = {
			operations: [
				{
					data: {},
				},
			],
		};

		switch (selectedDeleteData.levels) {
			case "location":
			payload.operations[0].data.ca_location = { id: selectedDeleteData.id };
				break;
			case "floor":
			payload.operations[0].data.ca_floor = { id: selectedDeleteData.id };
				break;
			case "zone":
			payload.operations[0].data.ca_zone = { id: selectedDeleteData.id };
				break;
			case "room":
			payload.operations[0].data.ca_room = { id: selectedDeleteData.id };
				break;
			case "asset":
				payload.operations[0].action = {
					ca_asset: { action: "delete", deletechildren: true },
				};
			payload.operations[0].data.ca_asset = { id: selectedDeleteData.id };
				break;
			default:
				break;
		}

		try {
			const res = await api.delete("data/rest", { data: payload });
			if (res?.data) {
				getLocationPlansData();
				setSelectedDeleteData({});
			}
		} catch (error) {
			console.error("Error deleting record:", error);
		}
	};

	const handleDetailRemove = () => {
		if (!selectedNode) return;
		handleDelete(selectedNode.data, selectedNode.type);
	};

	const toggleExpanded = (nodeId: string) => {
		setExpandedIds((prev) =>
			prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
		);
	};

	const handleSelectNode = (nodeId: string) => {
		setSelectedNodeId(nodeId);
	};

	const renderNavItems = (nodes: TreeNode[], depth = 0) =>
		nodes.map((node) => {
			const isSelected = node.nodeId === selectedNodeId;
			const isMatched = matchedNodeIds.includes(node.nodeId);
			const hasChildren = node.type !== "asset" && node.children.length > 0;
			const isExpanded = expandedIds.includes(node.nodeId);

			const handleClick = () => {
				handleSelectNode(node.nodeId);
				if (hasChildren) {
					toggleExpanded(node.nodeId);
				}
			};

			const handleExpandClick = (event: React.MouseEvent) => {
				event.stopPropagation();
				toggleExpanded(node.nodeId);
			};

			return (
				<Box key={node.nodeId}>
					<ListItemButton
						onClick={handleClick}
						selected={isSelected}
						sx={{
							pl: 1 + depth * 1,
							py: 0.5,
							alignItems: "center",
							borderLeft: isSelected ? "3px solid #743ee4" : "3px solid transparent",
							bgcolor: isSelected
								? "action.selected"
								: isMatched
								? "action.hover"
								: "transparent",
						}}
					>
						{hasChildren && (
							<IconButton
								size="small"
								onClick={handleExpandClick}
								// sx={{ mr: 1 }}
								aria-label={isExpanded ? "Collapse" : "Expand"}
							>
								{isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
							</IconButton>
						)}
						{!hasChildren && <Box sx={{ width: 36, mr: 1 }} />}
						{renderLevelIcon(node.type)}
						<ListItemText
							primary={node.name}
							primaryTypographyProps={{
								variant: "body2",
								fontWeight: isSelected || isMatched ? 600 : 400,
								color: "text.primary",
							}}
						/>
					</ListItemButton>
					{hasChildren && (
						<Collapse in={isExpanded} timeout="auto" unmountOnExit>
							<List disablePadding>{renderNavItems(node.children, depth + 1)}</List>
						</Collapse>
					)}
				</Box>
			);
		});

	const renderDetailHeaderActions = () => {
		if (!selectedNode) return null;

		const commonSx = {
			textTransform: "none",
			fontSize: 13,
			px: 2.5,
			borderRadius: 20,
		};

		const actions: ReactNode[] = [];

		const addButton = (label: string, handler: () => void, color: string) => (
			<Button
				key={label}
				variant="contained"
				size="small"
				startIcon={<AddIcon />}
				sx={{
					...commonSx,
					backgroundColor: color,
					"&:hover": { backgroundColor: color === "#5A58FF" ? "#4846d3" : "#109184" },
				}}
				onClick={handler}
			>
				{label}
			</Button>
		);

		const editButton = (label: string) => (
			<Button
				key="edit"
				variant="outlined"
				size="small"
				startIcon={<EditIcon />}
				sx={commonSx}
				onClick={openEditModalForSelected}
			>
				{label}
			</Button>
		);

		const deleteButton = (
			<Button
				key="delete"
				variant="outlined"
				color="error"
				size="small"
				startIcon={<DeleteIcon />}
				sx={commonSx}
				onClick={handleDetailRemove}
			>
				Delete
			</Button>
		);

		switch (selectedNode.type) {
			case "location":
				actions.push(
					addButton("New Floor", () => {
						setParentId(selectedNode.data.id);
						setFloorModalData({});
						setAddFloorModal(true);
					}, "#5A58FF"),
					addButton("New Asset", () => handleAddAsset(selectedNode.data, "location"), "#14b8a6"),
					editButton("Edit Location"),
					deleteButton
				);
				break;
			case "floor":
				actions.push(
					addButton("New Zone", () => {
						setParentId(selectedNode.data.id);
						setZoneModalData({});
						setAddZoneModal(true);
					}, "#5A58FF"),
					addButton("New Asset", () => handleAddAsset(selectedNode.data, "floor"), "#14b8a6"),
					editButton("Edit Floor"),
					deleteButton
				);
				break;
			case "zone":
				actions.push(
					addButton("New Room", () => {
						setParentId(selectedNode.data.id);
						setRoomModalData({});
						setAddRoomModal(true);
					}, "#5A58FF"),
					addButton("New Asset", () => handleAddAsset(selectedNode.data, "zone"), "#14b8a6"),
					editButton("Edit Zone"),
					deleteButton
				);
				break;
			case "room":
				actions.push(
					addButton("New Asset", () => handleAddAsset(selectedNode.data, "room"), "#14b8a6"),
					editButton("Edit Room"),
					deleteButton
				);
				break;
			case "asset":
				actions.push(editButton("Edit Asset"), deleteButton);
				break;
			default:
				break;
		}

		return actions;
		};

	const renderDetailRows = () => {
		if (!selectedNode) return null;

		return DETAIL_FIELDS[selectedNode.type].map((field) => (
			<>
                {/* <Box
                    key={field.key}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "200px 1fr" },
                        gap: 1.5,
                        alignItems: "flex-start",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        py: 1.5,
                    }}
                >
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {field.label}
                    </Typography>
                    <Typography variant="body2">{buildDisplayValue(selectedNode, field.key)}</Typography>
                </Box> */}
                <div className="col-6 view-data">
                    <h6>{field.label}</h6>
                     {field.key !== "tags" && (
                        <p>{buildDisplayValue(selectedNode, field.key)}</p>
                     )}
                     {field.key === "tags" && (
                        <Box className="mt-1">
							{(() => {
								const value = buildDisplayValue(selectedNode, field.key);
								if (!value || value === "—") {
									return <p>-</p>;
								}
								return value
									.split(",")
									.map((tag) => tag.trim())
									.filter(Boolean)
									.map((tag) => (
										<Chip key={tag} label={tag} size="small" color="secondary" className="me-1" />
									));
							})()}
                        </Box>
                     )}

                </div>
            </>
		));
	};

	return (
		<Box className="onboard-container h-100">
			{/* <Box
				sx={{
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					alignItems: { md: "center" },
					justifyContent: "space-between",
					gap: 2,
					mb: 3,
				}}
			>
				<Typography variant="h5" fontWeight={700}>
					Onboard
				</Typography>
				<TextField
					size="small"
							placeholder="Search..."
							value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
						endAdornment: searchTerm ? (
							<InputAdornment position="end">
								<IconButton size="small" onClick={() => setSearchTerm("")} aria-label="Clear search">
									<CloseIcon fontSize="small" />
								</IconButton>
							</InputAdornment>
						) : undefined,
					}}
					sx={{ width: { xs: "100%", md: 280 } }}
				/>
			</Box> */}

			{loading && (
				<Box
					sx={{
						position: "fixed",
						top: 0,
						left: 0,
						width: "100vw",
						height: "100vh",
						backgroundColor: "rgba(0,0,0,0.3)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1400,
					}}
				>
					<CircularProgress size={48} thickness={4} />
				</Box>
			)}

			<Box className="h-100"
				sx={{
					display: "flex",
					flexDirection: { xs: "column", lg: "row" },
					gap: 2,
					alignItems: "stretch",
				}}
			>
				<Paper 
					elevation={0}
					sx={{
						width: { xs: "100%", lg: 320 },
						flexShrink: 0,
						borderRadius: 3,
						border: "1px solid",
						borderColor: "divider",
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
						// maxHeight: "calc(100vh - 220px)",
						minHeight:'400px'
					}}
				>
					<Box className="pb-1 pt-2" sx={{ px: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<Typography variant="h2">
							Locations
						</Typography>
						<Button
							size="small"
							variant="contained"
							startIcon={<AddIcon />}
									onClick={() => {
										setLocationModalData({});
								setAddLocationModal(true);
									}}
							sx={{ textTransform: "none", borderRadius: 20 }}
								>
							New Location
								</Button>
					</Box>
					<Divider />
                    <Box className="py-1" sx={{ px: 2 }}>
                            <TextField
                            size="small"
                                    placeholder="Search..."
                                    value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm("")} aria-label="Clear search">
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : undefined,
                            }}
                            sx={{ width: { xs: "100%", md: 280 } }}
                        />
                    </Box>
                    <Divider className="mb-1" />
					{roots.length === 0 ? (
						<Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
							<Typography variant="body2">No locations found. Start by creating one.</Typography>
						</Box>
					) : (
						<List disablePadding sx={{ flexGrow: 1, overflowY: "auto", px: 1 }}>
							{renderNavItems(roots)}
						</List>
					)}
				</Paper>

				<Paper
					elevation={0}
					sx={{
						flexGrow: 1,
						borderRadius: 3,
						border: "1px solid",
						borderColor: "divider",
						// p: { xs: 2, md: 3 },
                        px: 2 ,
                        pb: 2,
                        pt:1,
					}}
				>
					{selectedNode ? (
						<>
							<Box
								sx={{
									display: "flex",
									flexDirection: { xs: "column", md: "row" },
									alignItems: { md: "center" },
									justifyContent: "space-between",
									gap: 2,
								}}
							>
								<Box>
									<Typography variant="h2" fontWeight={700}>
										{selectedNode.name} Details
									</Typography>
									<Typography variant="h6" color="text.secondary">
										View & update details for the {LEVEL_LABELS[selectedNode.type].toLowerCase()}.
									</Typography>
								</Box>
								<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{renderDetailHeaderActions()}</Box>
							</Box>

							<Box mt={4}>
                                <div className="row">
                                     {renderDetailRows()}
                                </div>
                            </Box>
						</>
					) : (
						<Box
							sx={{
								height: "100%",
								minHeight: 320,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexDirection: "column",
								textAlign: "center",
								color: "text.secondary",
							}}
						>
							<Typography variant="subtitle1" fontWeight={600}>
								Select an item from the tree
							</Typography>
							<Typography variant="body2">
								Choose a location, floor, zone, room, or asset to view its details.
							</Typography>
              </Box>
            )}
				</Paper>
			</Box>

			<RightSideModal
				isOpen={addLocationModal}
				onClose={() => setAddLocationModal(false)}
				title={Object.keys(locationModalData || {}).length === 0 ? "Add Location" : "Edit Location"}
			>
				<LocationModal
					data={locationModalData}
					setData={setLocationModalData}
					submitData={submitLocationData}
				/>
			</RightSideModal>

			<RightSideModal
				isOpen={addFloorModal}
				onClose={() => setAddFloorModal(false)}
				title={Object.keys(floorModalData || {}).length === 0 ? "Add Floor" : "Edit Floor"}
			>
				<FloorModal
					data={floorModalData}
					setData={setFloorModalData}
					submitData={submitFloorData}
				/>
			</RightSideModal>

			<RightSideModal
				isOpen={addZoneModal}
				onClose={() => setAddZoneModal(false)}
				title={Object.keys(zoneModalData || {}).length === 0 ? "Add Zone" : "Edit Zone"}
			>
				<ZoneModal
					data={zoneModalData}
					setData={setZoneModalData}
					submitData={submitZoneData}
				/>
			</RightSideModal>

			<RightSideModal
				isOpen={addRoomModal}
				onClose={() => setAddRoomModal(false)}
				title={Object.keys(roomModalData || {}).length === 0 ? "Add Room" : "Edit Room"}
			>
				<RoomModal
					data={roomModalData}
					setData={setRoomModalData}
					submitData={submitRoomData}
				/>
			</RightSideModal>

			<RightSideModal
				isOpen={addAssetModal}
				onClose={() => setAddAssetModal(false)}
				title={assetModalData ? "Edit Asset" : "Add Asset"}
			>
				<AssetModal
					data={assetModalData}
					setData={setAssetModalData}
					submitData={submitAssetData}
				/>
			</RightSideModal>

			<Dialog
				open={confirmationModalShow}
				onClose={() => setConfirmationModalShow(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogContent sx={{ textAlign: "center", pt: 4 }}>
					<Typography variant="body1">
						Are you sure you want to delete the following {selectedDeleteData.levels}?{" "}
						<Box component="span" fontWeight={700}>
								{selectedDeleteData.name}
							</Box>
						?
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
					<Button variant="outlined" onClick={() => setConfirmationModalShow(false)}>
							Cancel
						</Button>
					<Button variant="contained" color="error" onClick={deleteLevelsDataConfirmation}>
							Delete
						</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default Onboard;

