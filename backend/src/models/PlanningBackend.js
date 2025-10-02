export class PlanningBackend {
    constructor() {
        this.initiators = [
            { id: 1, full_name: 'Петрова Мария', position: 'Руководитель отдела', department: 'Озеленение' },
            { id: 2, full_name: 'Козлов Дмитрий', position: 'Координатор', department: 'Проекты' },
            { id: 3, full_name: 'Семенов Игорь', position: 'Координатор', department: 'Декорации' }
        ];
        
        this.brigadiers = [
            { id: 101, full_name: 'Иванов Алексей Петрович', specialization: 'Старший садовник' },
            { id: 102, full_name: 'Сидорова Ольга Владимировна', specialization: 'Старший декоратор' },
            { id: 103, full_name: 'Петров Сергей Иванович', specialization: 'Садовник' },
            { id: 104, full_name: 'Кузнецова Анна Михайловна', specialization: 'Декоратор' },
            { id: 105, full_name: 'Васильев Максим Андреевич', specialization: 'Установщик деревьев' },
            { id: 106, full_name: 'Николаева Екатерина Сергеевна', specialization: 'Специалист по озеленению' }
        ];
        
        this.assignments = [];
        this.currentInitiator = this.initiators[0];
    }

    getDateString(daysFromToday = 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromToday);
        return date.toISOString().split('T')[0];
    }

    getAssignments(dateRange) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const filtered = this.assignments.filter(assignment => {
                    return assignment.work_days.some(day => 
                        day >= dateRange.startDate && day <= dateRange.endDate
                    );
                }).map(assignment => ({
                    ...assignment,
                    brigadier: this.brigadiers.find(b => b.id === assignment.brigadier_id),
                    initiator: this.initiators.find(i => i.id === assignment.initiator_id)
                }));
                
                resolve(filtered);
            }, 300);
        });
    }

    createAssignment(brigadierId, startDate, endDate, initiatorId = 1) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const conflict = this.assignments.find(assignment => 
                    assignment.brigadier_id === brigadierId &&
                    assignment.start_date <= endDate &&
                    assignment.end_date >= startDate
                );
                
                if (conflict) {
                    const conflictBrigadier = this.brigadiers.find(b => b.id === conflict.brigadier_id);
                    const conflictInitiator = this.initiators.find(i => i.id === conflict.initiator_id);
                    reject(new Error(`Бригадир уже назначен ${conflictInitiator.full_name} на период ${conflict.start_date} - ${conflict.end_date}`));
                    return;
                }

                const workDays = [];
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                    workDays.push(date.toISOString().split('T')[0]);
                }
                
                const newAssignment = {
                    id: Date.now(),
                    brigadier_id: parseInt(brigadierId),
                    initiator_id: initiatorId,
                    status: 'requested',
                    start_date: startDate,
                    end_date: endDate,
                    work_days: workDays,
                    created_at: new Date().toISOString()
                };
                
                this.assignments.push(newAssignment);
                
                resolve({
                    ...newAssignment,
                    brigadier: this.brigadiers.find(b => b.id === parseInt(brigadierId)),
                    initiator: this.initiators.find(i => i.id === initiatorId)
                });
            }, 500);
        });
    }

    updateAssignmentStatus(assignmentId, status) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const assignment = this.assignments.find(a => a.id === parseInt(assignmentId));
                if (assignment) {
                    assignment.status = status;
                    resolve(assignment);
                } else {
                    reject(new Error('Назначение не найдено'));
                }
            }, 300);
        });
    }

    getAvailableBrigadiers() {
        return this.brigadiers;
    }

    resetData() {
        this.assignments = [];
        return true;
    }
}
