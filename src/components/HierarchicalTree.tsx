import * as React from "react";
import { TreeNode, VariableGroup } from "../types/types";
import { Icon } from "azure-devops-ui/Icon";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import "./HierarchicalTree.css";

interface HierarchicalTreeProps {
    root: TreeNode;
    onVariableGroupClick: (vg: VariableGroup, openInNewTab: boolean) => void;
}

interface TreeNodeItemProps {
    node: TreeNode;
    level: number;
    onVariableGroupClick: (vg: VariableGroup, openInNewTab: boolean) => void;
    onToggle: (node: TreeNode) => void;
}

interface TreeNodeItemState {
    isExpanded: boolean;
}

class TreeNodeItem extends React.Component<TreeNodeItemProps, TreeNodeItemState> {
    constructor(props: TreeNodeItemProps) {
        super(props);
        this.state = {
            isExpanded: props.node.isExpanded
        };
    }

    private handleToggle = () => {
        this.setState(prevState => ({
            isExpanded: !prevState.isExpanded
        }));
        this.props.onToggle(this.props.node);
    };

    private handleClick = (e: React.MouseEvent) => {
        const { node, onVariableGroupClick } = this.props;
        
        if (node.variableGroup) {
            // Ctrl veya middle click ile yeni sekmede aç
            const openInNewTab = e.ctrlKey || e.metaKey || e.button === 1;
            e.preventDefault();
            onVariableGroupClick(node.variableGroup, openInNewTab);
        } else {
            // Grup ise toggle yap
            this.handleToggle();
        }
    };

    private handleContextMenu = (e: React.MouseEvent) => {
        const { node, onVariableGroupClick } = this.props;
        
        if (node.variableGroup) {
            e.preventDefault();
            // Sağ tık ile yeni sekmede aç
            onVariableGroupClick(node.variableGroup, true);
        }
    };

    render() {
        const { node, level } = this.props;
        const { isExpanded } = this.state;
        const hasChildren = node.children.size > 0;
        const isVariableGroup = !!node.variableGroup;

        const paddingLeft = level * 20;

        return (
            <>
                <div
                    className={`tree-node-item ${isVariableGroup ? 'variable-group' : 'folder'}`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    onClick={this.handleClick}
                    onContextMenu={this.handleContextMenu}
                >
                    <div className="tree-node-content">
                        {hasChildren && !isVariableGroup && (
                            <Icon
                                iconName={isExpanded ? "ChevronDown" : "ChevronRight"}
                                className="tree-node-icon"
                            />
                        )}
                        {!hasChildren && !isVariableGroup && (
                            <div className="tree-node-icon-placeholder" />
                        )}
                        <Icon
                            iconName={isVariableGroup ? "Variable" : "FabricFolder"}
                            className="tree-node-type-icon"
                        />
                        <span className="tree-node-name">
                            {node.name}
                        </span>
                        {isVariableGroup && node.variableGroup?.description && (
                            <Tooltip text={node.variableGroup.description}>
                                <Icon iconName="Info" className="tree-node-info-icon" />
                            </Tooltip>
                        )}
                    </div>
                </div>
                
                {hasChildren && isExpanded && (
                    <div className="tree-node-children">
                        {Array.from(node.children.values()).map((childNode) => (
                            <TreeNodeItem
                                key={childNode.fullPath}
                                node={childNode}
                                level={level + 1}
                                onVariableGroupClick={this.props.onVariableGroupClick}
                                onToggle={this.props.onToggle}
                            />
                        ))}
                    </div>
                )}
            </>
        );
    }
}

interface HierarchicalTreeState {
    expandedNodes: Set<string>;
}

export class HierarchicalTree extends React.Component<HierarchicalTreeProps, HierarchicalTreeState> {
    constructor(props: HierarchicalTreeProps) {
        super(props);
        this.state = {
            expandedNodes: new Set()
        };
    }

    private handleToggle = (node: TreeNode) => {
        this.setState(prevState => {
            const expandedNodes = new Set(prevState.expandedNodes);
            if (expandedNodes.has(node.fullPath)) {
                expandedNodes.delete(node.fullPath);
            } else {
                expandedNodes.add(node.fullPath);
            }
            return { expandedNodes };
        });
    };

    render() {
        const { root, onVariableGroupClick } = this.props;

        return (
            <div className="hierarchical-tree">
                {Array.from(root.children.values()).map((node) => (
                    <TreeNodeItem
                        key={node.fullPath}
                        node={node}
                        level={0}
                        onVariableGroupClick={onVariableGroupClick}
                        onToggle={this.handleToggle}
                    />
                ))}
            </div>
        );
    }
}
