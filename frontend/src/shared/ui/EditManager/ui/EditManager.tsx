import {Button} from "@/shared/ui";
import IconEdit from "@/shared/assets/icons/icon-edit.svg";
import cls from "./EditManager.module.css";

type EditManagerProps = {
    onEdit: () => void;
    onSwitchMode: () => void;
    isEditing: boolean;
}

export const EditManager = (props: EditManagerProps) => {
    const {onEdit, onSwitchMode, isEditing} = props;


    if (isEditing) return (
        <div className={cls.wrapper}>
            <Button intent="edit" onClick={onEdit}>Save</Button>
            <Button onClick={onSwitchMode}>Cancel</Button>
        </div>
    )

    return <Button intent="edit" onClick={onSwitchMode} aria-label="Edit"><IconEdit /></Button>

}