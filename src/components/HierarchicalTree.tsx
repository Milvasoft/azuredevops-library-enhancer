import * as React from "react";
import { TreeNode, VariableGroup } from "../types/types";
import { Icon } from "azure-devops-ui/Icon";
import "./HierarchicalTree.css";

interface HierarchicalTreeProps {
    root: TreeNode;
    onVariableGroupClick: (vg: VariableGroup, openInNewTab: boolean) => void;
}

interface TreeNodeItemProps {
    node: TreeNode;
    level: number;
    onVariableGroupClick: (vg: VariableGroup, openInNewTab: boolean) => void;
}

interface TreeNodeItemState {
    isExpanded: boolean;
}

class TreeNodeItem extends React.Component<TreeNodeItemProps, TreeNodeItemState> {
    constructor(props: TreeNodeItemProps) {
        super(props);
        this.state = {
            isExpanded: false
        };
    }

    private handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        this.setState(prevState => ({
            isExpanded: !prevState.isExpanded
        }));
    };

    private handleRowClick = (e: React.MouseEvent) => {
        const { node, onVariableGroupClick } = this.props;
        const hasChildren = node.children.size > 0;
        
        // Eğer child'ları varsa collapse/expand yap
        if (hasChildren) {
            this.setState(prevState => ({
                isExpanded: !prevState.isExpanded
            }));
        }
        // Eğer variable group ise ve child'ı yoksa aç
        else if (node.variableGroup) {
            const openInNewTab = e.ctrlKey || e.metaKey;
            onVariableGroupClick(node.variableGroup, openInNewTab);
        }
    };

    private handleContextMenu = (e: React.MouseEvent) => {
        const { node, onVariableGroupClick } = this.props;
        
        if (node.variableGroup) {
            e.preventDefault();
            onVariableGroupClick(node.variableGroup, true);
        }
    };

    render() {
        const { node, level } = this.props;
        const { isExpanded } = this.state;
        const hasChildren = node.children.size > 0;
        const isVariableGroup = !!node.variableGroup;
        const variableCount = node.variableGroup ? Object.keys(node.variableGroup.variables || {}).length : 0;
        
        // Format date
        const modifiedDate = node.variableGroup?.modifiedOn 
            ? new Date(node.variableGroup.modifiedOn).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })
            : '';
        
        const modifiedBy = node.variableGroup?.modifiedBy?.displayName || '';

        return (
            <>
                <div
                    className={`table-row ${isVariableGroup ? 'variable-group-row' : 'folder-row'} ${hasChildren && isExpanded ? 'expanded-parent' : ''}`}
                    style={{ 
                        paddingLeft: 0,
                        backgroundColor: level > 0 ? `rgba(0, 0, 0, ${0.02 + (level * 0.02)})` : undefined
                    }}
                    onClick={this.handleRowClick}
                    onContextMenu={this.handleContextMenu}
                >
                    <div className="table-cell name-column" style={{ paddingLeft: `${16 + level * 20}px` }}>
                        {hasChildren && (
                            <Icon
                                iconName={isExpanded ? "ChevronDown" : "ChevronRight"}
                                className="chevron-icon"
                            />
                        )}
                        {!hasChildren && <div className="chevron-placeholder" />}
                        <Icon
                            iconName={isVariableGroup ? "Variable2" : "FabricFolderFill"}
                            className={`type-icon ${isVariableGroup ? 'variable-icon' : 'folder-icon'}`}
                        />
                        <span className="node-name">{node.name}</span>
                        {hasChildren && !isVariableGroup && (
                            <span className="count-badge">{node.children.size}</span>
                        )}
                    </div>
                    <div className="table-cell date-column">
                        {modifiedDate}
                    </div>
                    <div className="table-cell modified-by-column">
                        {modifiedBy}
                    </div>
                    <div className="table-cell description-column">
                        {node.variableGroup?.description || ''}
                    </div>
                    <div className="table-cell variables-column">
                        {isVariableGroup ? variableCount : ''}
                    </div>
                </div>
                
                {hasChildren && isExpanded && (
                    <>
                        {Array.from(node.children.values()).map((childNode) => (
                            <TreeNodeItem
                                key={childNode.fullPath}
                                node={childNode}
                                level={level + 1}
                                onVariableGroupClick={this.props.onVariableGroupClick}
                            />
                        ))}
                    </>
                )}
            </>
        );
    }
}

export class HierarchicalTree extends React.Component<HierarchicalTreeProps> {
    render() {
        const { root, onVariableGroupClick } = this.props;

        return (
            <div className="hierarchical-tree-table">
                <div className="table-header">
                    <div className="table-header-cell name-column">Name</div>
                    <div className="table-header-cell date-column">Date modified</div>
                    <div className="table-header-cell modified-by-column">Modified by</div>
                    <div className="table-header-cell description-column">Description</div>
                    <div className="table-header-cell variables-column">Variables</div>
                </div>
                <div className="table-body">
                    {Array.from(root.children.values()).map((node) => (
                        <TreeNodeItem
                            key={node.fullPath}
                            node={node}
                            level={0}
                            onVariableGroupClick={onVariableGroupClick}
                        />
                    ))}
                </div>
            </div>
        );
    }
}
