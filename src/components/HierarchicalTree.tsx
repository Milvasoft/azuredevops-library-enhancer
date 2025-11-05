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
    isCopied: boolean;
}

class TreeNodeItem extends React.Component<TreeNodeItemProps, TreeNodeItemState> {
    constructor(props: TreeNodeItemProps) {
        super(props);
        this.state = {
            isExpanded: false,
            isCopied: false
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
        
        // Middle mouse button click - open in new tab
        if (e.button === 1 && node.variableGroup) {
            e.preventDefault();
            onVariableGroupClick(node.variableGroup, true);
            return;
        }
        
        // If has children, collapse/expand
        if (hasChildren) {
            this.setState(prevState => ({
                isExpanded: !prevState.isExpanded
            }));
        }
        // If it's a variable group without children, open it
        else if (node.variableGroup) {
            const openInNewTab = e.ctrlKey || e.metaKey;
            onVariableGroupClick(node.variableGroup, openInNewTab);
        }
    };

    private handleMouseDown = (e: React.MouseEvent) => {
        // Capture middle mouse button click
        if (e.button === 1) {
            e.preventDefault();
            this.handleRowClick(e);
        }
    };

    private handleContextMenu = (e: React.MouseEvent) => {
        const { node, onVariableGroupClick } = this.props;
        
        if (node.variableGroup) {
            e.preventDefault();
            onVariableGroupClick(node.variableGroup, true);
        }
    };

    private handleCopyName = (e: React.MouseEvent) => {
        e.stopPropagation();
        const { node } = this.props;
        
        if (navigator.clipboard && node.variableGroup) {
            const fullName = node.variableGroup.name;
            navigator.clipboard.writeText(fullName).then(() => {
                this.setState({ isCopied: true });
                setTimeout(() => {
                    this.setState({ isCopied: false });
                }, 2000);
            }).catch(() => {
                // Silent fail
            });
        }
    };

    render() {
        const { node, level } = this.props;
        const { isExpanded, isCopied } = this.state;
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
                    onMouseDown={this.handleMouseDown}
                    onContextMenu={this.handleContextMenu}
                >
                    <div className="table-cell name-column" style={{ paddingLeft: `${16 + level * 20}px` }}>
                        {hasChildren && (
                            <span 
                                className="chevron-icon"
                                style={{ cursor: 'pointer', fontSize: '12px', marginRight: '4px' }}
                            >
                                {isExpanded ? '▼' : '▶'}
                            </span>
                        )}
                        {!hasChildren && <div className="chevron-placeholder" />}
                        <span 
                            className={`type-icon ${isVariableGroup ? 'variable-icon' : 'folder-icon'}`}
                            style={{ fontSize: '16px', marginRight: '8px' }}
                        >
                            {isVariableGroup ? '📦' : '📁'}
                        </span>
                        <span className="node-name">{node.name}</span>
                        {isVariableGroup && (
                            <span
                                className={`copy-icon ${isCopied ? 'copied' : ''}`}
                                onClick={this.handleCopyName}
                                title={isCopied ? "Copied!" : "Copy name"}
                                style={{ 
                                    fontSize: '14px', 
                                    marginLeft: '8px',
                                    cursor: 'pointer',
                                    opacity: 0
                                }}
                            >
                                {isCopied ? '✅' : '📄'}
                            </span>
                        )}
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
