import * as React from 'react';
import { ExperimentComponent } from './ExperimentComponent';

export interface IProgressionComponentProps  { 
    progression: any;
}

export default class ProgressionComponent extends React.Component<IProgressionComponentProps> {
    constructor(props: IProgressionComponentProps) {
        super(props);
    } 

    public render(): JSX.Element {
        let experiments = this.props.progression['Studies'].map((study: any) =>             
            <ExperimentComponent experiment={study}/>
        );

        return (
            <div className='progression'>
                <h3>Progression - {this.props.progression.Name}</h3>
                {experiments}
            </div>
        );
    }
}