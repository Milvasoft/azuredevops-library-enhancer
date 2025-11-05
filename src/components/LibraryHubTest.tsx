import * as React from "react";
import { Card } from "azure-devops-ui/Card";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { VariableGroup, TreeNode } from "../types/types";
import { VariableGroupService } from "../services/VariableGroupService";
import { HierarchicalTree } from "./HierarchicalTree";
import "./LibraryHub.css";
import "../styles/library-hub.css";

interface LibraryHubTestProps {
    variableGroups: VariableGroup[];
}

interface LibraryHubTestState {
    loading: boolean;
    error: string | null;
    treeRoot: TreeNode | null;
}

export class LibraryHubTest extends React.Component<LibraryHubTestProps, LibraryHubTestState> {

    constructor(props: LibraryHubTestProps) {
        super(props);
        this.state = {
            loading: false,
            error: null,
            treeRoot: null
        };
    }

    componentDidMount() {
        try {
            const { variableGroups } = this.props;
            console.log('Building hierarchy for', variableGroups.length, 'variable groups');
            
            const treeRoot = VariableGroupService.buildHierarchy(variableGroups);
            
            this.setState({
                loading: false,
                treeRoot
            });
        } catch (error) {
            console.error('Error building hierarchy:', error);
            this.setState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to build hierarchy"
            });
        }
    }

    private handleVariableGroupClick = (vg: VariableGroup, openInNewTab: boolean) => {
        const url = `https://milvasoft.visualstudio.com/Opsiyon/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=${vg.id}`;
        
        console.log(`${openInNewTab ? 'Opening in new tab' : 'Navigating to'}: ${vg.name} (${url})`);
        
        if (openInNewTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    };

    render() {
        const { loading, error, treeRoot } = this.state;

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
                    <h2>Library - Variable Groups</h2>
                    <div className="subtitle">{totalGroups} variable group{totalGroups !== 1 ? 's' : ''}</div>
                </div>
                <div className="tree-container">
                    <HierarchicalTree
                        root={treeRoot}
                        onVariableGroupClick={this.handleVariableGroupClick}
                    />
                </div>
            </div>
        );
    }
}
