import * as React from "react";
import "azure-devops-ui/Components/Icon/FluentIcons.css";
import { Card } from "azure-devops-ui/Card";
import { Icon } from "azure-devops-ui/Icon";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { VariableGroup, TreeNode } from "../types/types";
import { VariableGroupService } from "../services/VariableGroupService";
import { HierarchicalTree } from "./HierarchicalTree";
import "../styles/library-hub.css";

interface LibraryHubTestProps {
    variableGroups: VariableGroup[];
}

interface LibraryHubTestState {
    loading: boolean;
    error: string | null;
    treeRoot: TreeNode | null;
    viewMode: 'hierarchy' | 'list';
    searchQuery: string;
}

export class LibraryHubTest extends React.Component<LibraryHubTestProps, LibraryHubTestState> {

    constructor(props: LibraryHubTestProps) {
        super(props);
        this.state = {
            loading: false,
            error: null,
            treeRoot: null,
            viewMode: 'hierarchy',
            searchQuery: ''
        };
    }

    componentDidMount() {
        try {
            const { variableGroups } = this.props;
            
            const treeRoot = VariableGroupService.buildHierarchy(variableGroups);
            
            this.setState({
                loading: false,
                treeRoot
            });
        } catch (error) {
            this.setState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to build hierarchy"
            });
        }
    }

    private handleVariableGroupClick = (vg: VariableGroup, openInNewTab: boolean) => {
        const url = `https://milvasoft.visualstudio.com/Opsiyon/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=${vg.id}`;
        
        if (openInNewTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    };

    private toggleViewMode = () => {
        this.setState(prevState => ({
            viewMode: prevState.viewMode === 'hierarchy' ? 'list' : 'hierarchy'
        }));
    };

    private handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ searchQuery: event.target.value });
    };

    private filterVariableGroups = (groups: VariableGroup[], query: string): VariableGroup[] => {
        if (!query.trim()) {
            return groups;
        }
        
        const lowerQuery = query.toLowerCase();
        return groups.filter(vg => 
            vg.name.toLowerCase().includes(lowerQuery) ||
            (vg.description && vg.description.toLowerCase().includes(lowerQuery))
        );
    };

    render() {
        const { loading, error, treeRoot, viewMode, searchQuery } = this.state;
        const filteredGroups = this.filterVariableGroups(this.props.variableGroups, searchQuery);
        const filteredTreeRoot = searchQuery.trim() ? 
            VariableGroupService.buildHierarchy(filteredGroups) : treeRoot;

        if (loading) {
            return (
                <div className="library-hub-container">
                    <Card className="flex-grow">
                        <div className="loading-container">
                            <Spinner size={SpinnerSize.large} label="Loading variable groups..." />
                        </div>
                    </Card>
                </div>
            );
        }

        if (error) {
            return (
                <div className="library-hub-container">
                    <MessageCard severity={MessageCardSeverity.Error}>
                        {error}
                    </MessageCard>
                </div>
            );
        }

        if (!treeRoot || treeRoot.children.size === 0) {
            return (
                <div className="library-hub-container">
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <div className="empty-state-title">No Variable Groups</div>
                        <div className="empty-state-description">
                            No variable groups found in this project.
                        </div>
                    </div>
                </div>
            );
        }

        const totalGroups = this.props.variableGroups.length;

        return (
            <div className="library-hub-container">
                <div className="library-hub-header">
                    <div className="header-content">
                        <div>
                            <h2>Library - Variable Groups</h2>
                            <div className="subtitle">
                                {filteredGroups.length} of {totalGroups} variable group{totalGroups !== 1 ? 's' : ''}
                                {searchQuery && filteredGroups.length !== totalGroups && ' (filtered)'}
                            </div>
                        </div>
                        <div className="header-actions">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search variable groups..."
                                value={searchQuery}
                                onChange={this.handleSearchChange}
                            />
                            <div className="view-toggle">
                                <button 
                                    className={`toggle-button ${viewMode === 'hierarchy' ? 'active' : ''}`}
                                    onClick={this.toggleViewMode}
                                    title="Hierarchy View"
                                >
                                    <span className="icon">📑</span>
                                    Hierarchy
                                </button>
                                <button 
                                    className={`toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={this.toggleViewMode}
                                    title="List View"
                                >
                                    <span className="icon">📋</span>
                                    List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tree-container">
                    {viewMode === 'hierarchy' ? (
                        filteredTreeRoot && <HierarchicalTree
                            root={filteredTreeRoot}
                            onVariableGroupClick={this.handleVariableGroupClick}
                        />
                    ) : (
                        <div className="hierarchical-tree-table">
                            <div className="table-header">
                                <div className="table-header-cell name-column">Name</div>
                                <div className="table-header-cell date-column">Date modified</div>
                                <div className="table-header-cell modified-by-column">Modified by</div>
                                <div className="table-header-cell description-column">Description</div>
                                <div className="table-header-cell variables-column">Variables</div>
                            </div>
                            <div className="table-body">
                                {filteredGroups
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(vg => {
                                        const variableCount = Object.keys(vg.variables || {}).length;
                                        const modifiedDate = vg.modifiedOn 
                                            ? new Date(vg.modifiedOn).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                              })
                                            : '';
                                        const modifiedBy = vg.modifiedBy?.displayName || '';

                                        return (
                                            <div 
                                                key={vg.id}
                                                className="table-row variable-group-row"
                                                onClick={(e) => {
                                                    // Middle mouse button click - open in new tab
                                                    if (e.button === 1) {
                                                        e.preventDefault();
                                                        this.handleVariableGroupClick(vg, true);
                                                        return;
                                                    }
                                                    const openInNewTab = e.ctrlKey || e.metaKey;
                                                    this.handleVariableGroupClick(vg, openInNewTab);
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    this.handleVariableGroupClick(vg, true);
                                                }}
                                                onMouseDown={(e) => {
                                                    if (e.button === 1) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <div className="table-cell name-column" style={{ paddingLeft: '16px' }}>
                                                    <span className="node-name">{vg.name}</span>
                                                    <span
                                                        className="copy-icon"
                                                        style={{ 
                                                            fontSize: '14px', 
                                                            marginLeft: '8px',
                                                            cursor: 'pointer',
                                                            opacity: 0
                                                        }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (navigator.clipboard) {
                                                                    navigator.clipboard.writeText(vg.name).catch(err => {
                                                                        // Silent fail
                                                                    });
                                                                }
                                                            }}
                                                            title="Copy name"
                                                        >
                                                            🗐
                                                        </span>
                                                </div>
                                                <div className="table-cell date-column">
                                                    {modifiedDate}
                                                </div>
                                                <div className="table-cell modified-by-column">
                                                    {modifiedBy}
                                                </div>
                                                <div className="table-cell description-column">
                                                    {vg.description || ''}
                                                </div>
                                                <div className="table-cell variables-column">
                                                    {variableCount}
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
