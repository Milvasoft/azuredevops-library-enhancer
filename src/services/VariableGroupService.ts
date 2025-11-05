import { VariableGroup, TreeNode } from '../types/types';

export class VariableGroupService {
    
    /**
     * Variable Group isimlerini '-' karakterine göre parse ederek ağaç yapısı oluşturur
     */
    public static buildHierarchy(variableGroups: VariableGroup[]): TreeNode {
        const root: TreeNode = {
            name: 'root',
            fullPath: '',
            children: new Map(),
            isExpanded: true
        };

        // İki geçişli algoritma: Önce tüm node'ları oluştur, sonra parent variable group'ları kontrol et
        variableGroups.forEach(vg => {
            const parts = vg.name.split('-');
            let currentNode = root;

            parts.forEach((part, index) => {
                const isLastPart = index === parts.length - 1;
                const fullPath = parts.slice(0, index + 1).join('-');
                
                if (!currentNode.children.has(part)) {
                    const newNode: TreeNode = {
                        name: part,
                        fullPath: fullPath,
                        children: new Map(),
                        isExpanded: false
                    };

                    if (isLastPart) {
                        newNode.variableGroup = vg;
                    }

                    currentNode.children.set(part, newNode);
                } else if (isLastPart) {
                    const existingNode = currentNode.children.get(part)!;
                    if (!existingNode.variableGroup) {
                        existingNode.variableGroup = vg;
                    }
                }

                currentNode = currentNode.children.get(part)!;
            });
        });

        // İkinci geçiş: Eğer bir parent hem variable group hem de child'ları varsa,
        // parent'ı kendi child'ları içine de ekle
        const addParentAsChild = (node: TreeNode) => {
            node.children.forEach((childNode) => {
                // Eğer bu child'ın kendisi bir parent ve variable group ise
                if (childNode.children.size > 0 && childNode.variableGroup) {
                    // Kendisini kendi child'ları arasına ekle
                    const selfNode: TreeNode = {
                        name: childNode.name,
                        fullPath: childNode.fullPath,
                        children: new Map(),
                        isExpanded: false,
                        variableGroup: childNode.variableGroup
                    };
                    
                    // Yeni Map oluştur ve kendi node'u en başa ekle
                    const newChildren = new Map<string, TreeNode>();
                    newChildren.set(childNode.name, selfNode);
                    childNode.children.forEach((child, key) => {
                        newChildren.set(key, child);
                    });
                    childNode.children = newChildren;
                    
                    // Parent artık sadece folder
                    delete childNode.variableGroup;
                }
                
                // Recursive olarak devam et
                addParentAsChild(childNode);
            });
        };
        
        addParentAsChild(root);

        return root;
    }

    /**
     * Azure DevOps variable group detay sayfası URL'ini oluşturur
     */
    public static getVariableGroupUrl(
        organizationUrl: string,
        projectName: string,
        variableGroupId: number
    ): string {
        return `${organizationUrl}/${projectName}/_library?itemType=VariableGroups&view=VariableGroupView&variableGroupId=${variableGroupId}`;
    }

    /**
     * Tüm Variable Group'ları getir
     */
    public static async fetchVariableGroups(
        organizationUrl: string,
        projectName: string,
        accessToken: string
    ): Promise<VariableGroup[]> {
        const apiUrl = `${organizationUrl}/${projectName}/_apis/distributedtask/variablegroups?api-version=7.0`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch variable groups: ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    }
}
