import createBatch from "@/app/ServerActions/creategroups/createBatch"
import createBranch from "@/app/ServerActions/creategroups/createBranch"
import { ButtonShadcn } from "@/components/button"

type CreateBatchProps = {
  branchId: string;
};

export function CreateBatch({ branchId }: CreateBatchProps){
  return (
    <form action={createBatch.bind(null, branchId)}>
        <label htmlFor="batchname">New Batch:</label>
        <input type="text" id="batchname" name="batchname" placeholder="Enter Batch Name" />
        <ButtonShadcn variant="outline" type="submit">Add</ButtonShadcn>
    </form>
  )
}


export function CreateBranch(){
  return (
    <form action={createBranch}>
        <label htmlFor="branchname">New Branch:</label>
        <input type="text" id="branchname" name="branchname" placeholder="Enter Branch Name" />

        <ButtonShadcn variant="outline" type="submit">Add</ButtonShadcn>
    </form>
  )
}

