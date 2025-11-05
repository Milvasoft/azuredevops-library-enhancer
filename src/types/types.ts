export interface VariableGroup {
    id: number;
    name: string;
    description: string;
    type: string;
    variables?: { [key: string]: any };
}

export interface TreeNode {
    name: string;
    fullPath: string;
    children: Map<string, TreeNode>;
    variableGroup?: VariableGroup;
    isExpanded: boolean;
}
