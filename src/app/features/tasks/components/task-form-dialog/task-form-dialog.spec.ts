import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatChipInputEvent } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task, TaskPriority, TaskStatus, User } from '../../../../core/models';
import { TaskFormDialog, TaskFormDialogData } from './task-form-dialog';

const USER: User = {
  id: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  avatar: 'JD',
  role: 'Dev',
  department: 'Eng',
};

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    title: 'Existing task',
    description: 'desc',
    status: TaskStatus.InProgress,
    priority: TaskPriority.High,
    dueDate: new Date().toISOString(),
    assignee: USER,
    tags: ['a', 'b'],
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function chipEvent(value: string): MatChipInputEvent {
  return { value, chipInput: { clear: vi.fn() } } as unknown as MatChipInputEvent;
}

describe('TaskFormDialog', () => {
  let httpMock: HttpTestingController;
  let closeSpy: ReturnType<typeof vi.fn>;

  async function create(data: TaskFormDialogData) {
    closeSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TaskFormDialog);
    fixture.detectChanges();
    TestBed.tick();
    httpMock.expectOne('http://localhost:3000/users').flush([USER]);
    await Promise.resolve();
    TestBed.tick();
    return fixture.componentInstance;
  }

  afterEach(() => httpMock.verify());

  describe('create mode', () => {
    it('is not in edit mode and has default control values', async () => {
      const cmp = await create({});
      expect(cmp.isEditMode).toBe(false);
      expect(cmp.form.controls.priority.value).toBe(TaskPriority.Medium);
      expect(cmp.form.controls.status.value).toBe(TaskStatus.Todo);
      expect(cmp.tags()).toEqual([]);
    });

    it('is invalid when required fields are empty', async () => {
      const cmp = await create({});
      expect(cmp.form.invalid).toBe(true);
    });

    it('rejects a title shorter than 3 characters', async () => {
      const cmp = await create({});
      cmp.form.controls.title.setValue('ab');
      expect(cmp.form.controls.title.hasError('minlength')).toBe(true);
    });

    it('rejects a description over 500 characters', async () => {
      const cmp = await create({});
      cmp.form.controls.description.setValue('x'.repeat(501));
      expect(cmp.form.controls.description.hasError('maxlength')).toBe(true);
    });

    it('rejects a past due date when creating', async () => {
      const cmp = await create({});
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      cmp.form.controls.dueDate.setValue(yesterday);
      expect(cmp.form.controls.dueDate.hasError('dueDateInPast')).toBe(true);
    });

    it('accepts today as a due date when creating', async () => {
      const cmp = await create({});
      cmp.form.controls.dueDate.setValue(new Date());
      expect(cmp.form.controls.dueDate.hasError('dueDateInPast')).toBe(false);
    });

    it('onSubmit() does nothing and marks all as touched when invalid', async () => {
      const cmp = await create({});
      cmp.onSubmit();
      expect(closeSpy).not.toHaveBeenCalled();
      expect(cmp.form.controls.title.touched).toBe(true);
    });

    it('onSubmit() closes with a well-formed result when valid', async () => {
      const cmp = await create({});
      cmp.addTag(chipEvent('x'));
      cmp.form.patchValue({
        title: 'New task',
        description: 'desc',
        priority: TaskPriority.Low,
        status: TaskStatus.Todo,
        dueDate: new Date('2030-06-15'),
        assigneeId: 'u1',
        tags: ['x'],
      });

      cmp.onSubmit();

      expect(closeSpy).toHaveBeenCalledWith({
        title: 'New task',
        description: 'desc',
        priority: TaskPriority.Low,
        status: TaskStatus.Todo,
        dueDate: '2030-06-15',
        assignee: { id: 'u1', name: 'Jane Doe', avatar: 'JD', email: 'jane@example.com' },
        tags: ['x'],
      });
    });

    it('onCancel() closes the dialog with no result', async () => {
      const cmp = await create({});
      cmp.onCancel();
      expect(closeSpy).toHaveBeenCalledWith();
    });
  });

  describe('edit mode', () => {
    it('patches the form from the existing task and pushes its tags', async () => {
      const task = makeTask();
      const cmp = await create({ task });

      expect(cmp.isEditMode).toBe(true);
      expect(cmp.form.controls.title.value).toBe('Existing task');
      expect(cmp.form.controls.assigneeId.value).toBe('u1');
      expect(cmp.tags()).toEqual(['a', 'b']);
    });

    it('does not apply the not-in-the-past validator', async () => {
      const task = makeTask({ dueDate: new Date('2000-01-01').toISOString() });
      const cmp = await create({ task });
      expect(cmp.form.controls.dueDate.hasError('dueDateInPast')).toBe(false);
    });
  });

  describe('tags', () => {
    it('addTag() appends a trimmed, non-duplicate value', async () => {
      const cmp = await create({});
      cmp.addTag(chipEvent('  urgent  '));
      expect(cmp.tags()).toEqual(['urgent']);
    });

    it('addTag() ignores blank input', async () => {
      const cmp = await create({});
      cmp.addTag(chipEvent('   '));
      expect(cmp.tags()).toEqual([]);
    });

    it('addTag() ignores an already-present tag', async () => {
      const cmp = await create({});
      cmp.addTag(chipEvent('urgent'));
      cmp.addTag(chipEvent('urgent'));
      expect(cmp.tags()).toEqual(['urgent']);
    });

    it('removeTag() removes the tag at the given index', async () => {
      const cmp = await create({});
      cmp.addTag(chipEvent('a'));
      cmp.addTag(chipEvent('b'));
      cmp.removeTag(0);
      expect(cmp.tags()).toEqual(['b']);
    });
  });
});
