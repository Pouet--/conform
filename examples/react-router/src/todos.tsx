import type { SubmissionResult } from '@conform-to/react';
import {
	useForm,
	control,
	getFormProps,
	getInputProps,
	getFieldsetProps,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json, redirect } from 'react-router-dom';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().optional(),
});

const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, {
		schema: todosSchema,
	});

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const lastResult = useActionData() as SubmissionResult<string[]>;
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: todosSchema });
		},
	});
	const tasks = fields.tasks.getFieldList();

	return (
		<Form method="post" {...getFormProps(form)}>
			<div>
				<label>Title</label>
				<input
					className={!fields.title.valid ? 'error' : ''}
					{...getInputProps(fields.title)}
				/>
				<div>{fields.title.errors}</div>
			</div>
			<hr />
			<div className="form-error">{fields.tasks.errors}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key} {...getFieldsetProps(task)}>
						<div>
							<label>Task #${index + 1}</label>
							<input
								className={!taskFields.content.valid ? 'error' : ''}
								{...getInputProps(taskFields.content)}
							/>
							<div>{taskFields.content.errors}</div>
						</div>
						<div>
							<label>
								<span>Completed</span>
								<input
									className={!taskFields.completed.valid ? 'error' : ''}
									{...getInputProps(taskFields.completed, {
										type: 'checkbox',
									})}
								/>
							</label>
						</div>
						<button
							{...form.getControlButtonProps(
								control.remove({ name: fields.tasks.name, index }),
							)}
						>
							Delete
						</button>
						<button
							{...form.getControlButtonProps(
								control.reorder({
									name: fields.tasks.name,
									from: index,
									to: 0,
								}),
							)}
						>
							Move to top
						</button>
						<button
							{...form.getControlButtonProps(
								control.replace({ name: task.name, value: { content: '' } }),
							)}
						>
							Clear
						</button>
					</fieldset>
				);
			})}
			<button
				{...form.getControlButtonProps(
					control.insert({ name: fields.tasks.name }),
				)}
			>
				Add task
			</button>
			<hr />
			<button>Save</button>
		</Form>
	);
}
